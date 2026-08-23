import prisma from "../prisma/client";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/errors";
import { normalizeDomain } from "../lib/domain";
import { classifyDomain, type ActivityCategory } from "../constants/categories";
import {
  summarizeActivities,
} from "./activity-analytics";
import type { ActivityEventInput } from "../utils/validation";

export const MAX_DURATION_SECONDS = 24 * 60 * 60; // 24h per session
const MAX_FUTURE_SKEW_MS = 15 * 60 * 1000; // tolerate small client clock skew
const SUMMARY_TAKE = 2000;

export interface SubmitResult {
  created: number;
  duplicates: number;
  skipped: number;
}

interface ValidEvent {
  website: string;
  category: ActivityCategory;
  clientEventId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

function toValidEvent(
  event: ActivityEventInput,
  overrides: Record<string, ActivityCategory>
): ValidEvent | null {
  const website = normalizeDomain(event.website);
  if (!website) return null;

  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return null;
  }

  const durationMs = endTime.getTime() - startTime.getTime();
  if (durationMs <= 0) return null;

  const duration = Math.round(durationMs / 1000);
  if (duration > MAX_DURATION_SECONDS) return null;

  if (startTime.getTime() > Date.now() + MAX_FUTURE_SKEW_MS) return null;

  return {
    website,
    // The server is authoritative for categorization - it always reclassifies
    // the normalized domain instead of trusting the client-supplied category.
    category: classifyDomain(website, overrides),
    clientEventId: event.clientEventId,
    startTime,
    endTime,
    duration,
  };
}

function overlaps(
  existing: { startTime: Date; endTime: Date; application: string },
  candidate: ValidEvent
): boolean {
  const contains =
    existing.startTime.getTime() <= candidate.startTime.getTime() &&
    existing.endTime.getTime() >= candidate.endTime.getTime();
  return contains && existing.application === candidate.website;
}

async function getUserOverrides(userId: string): Promise<Record<string, ActivityCategory>> {
  const rows = await prisma.categoryOverride.findMany({
    where: { userId },
    select: { website: true, category: true },
  });
  const map: Record<string, ActivityCategory> = {};
  for (const row of rows) {
    map[row.website] = row.category as ActivityCategory;
  }
  return map;
}

export const activityService = {
  async submit(userId: string, events: ActivityEventInput[]): Promise<SubmitResult> {
    const overrides = await getUserOverrides(userId);
    const valid = events
      .map((e) => toValidEvent(e, overrides))
      .filter((e): e is ValidEvent => e !== null);

    if (valid.length === 0) {
      return { created: 0, duplicates: 0, skipped: events.length };
    }

    // Load existing browser activity that could overlap this batch so retries
    // and re-sent events can't double-count.
    const minStart = new Date(Math.min(...valid.map((e) => e.startTime.getTime())));
    const maxEnd = new Date(Math.max(...valid.map((e) => e.endTime.getTime())));

    const existing = await prisma.activity.findMany({
      where: {
        userId,
        source: "browser",
        startTime: { lte: maxEnd },
        endTime: { gte: minStart },
      },
      select: {
        application: true,
        startTime: true,
        endTime: true,
        clientEventId: true,
      },
    });

    const existingStartTimes = new Set(
      existing.map((e) => e.startTime.getTime())
    );
    const existingEventIds = new Set(existing.map((e) => e.clientEventId));

    const toInsert: Prisma.ActivityCreateManyInput[] = [];
    let duplicates = 0;
    let skipped = 0;

    for (const event of valid) {
      if (existingEventIds.has(event.clientEventId)) {
        duplicates++;
        continue;
      }
      if (existingStartTimes.has(event.startTime.getTime())) {
        // Same activity already recorded for this exact start.
        duplicates++;
        continue;
      }
      if (existing.some((e) => overlaps(e, event))) {
        duplicates++;
        continue;
      }

      toInsert.push({
        userId,
        application: event.website,
        category: event.category,
        source: "browser",
        clientEventId: event.clientEventId,
        startTime: event.startTime,
        endTime: event.endTime,
        duration: event.duration,
      });

      // Keep the in-memory guards in sync so intra-batch duplicates are caught.
      existingEventIds.add(event.clientEventId);
      existingStartTimes.add(event.startTime.getTime());
    }

    if (toInsert.length === 0) {
      return { created: 0, duplicates, skipped };
    }

    // The unique (userId, clientEventId) constraint is the final safety net for
    // races between concurrent flush attempts. skipDuplicates treats those as
    // already-stored and never double-counts them.
    const created = await prisma.activity.createMany({
      data: toInsert,
      skipDuplicates: true,
    });

    return {
      created: created.count,
      duplicates: duplicates + (toInsert.length - created.count),
      skipped,
    };
  },

  async list(
    userId: string,
    from?: Date,
    to?: Date
  ) {
    return prisma.activity.findMany({
      where: {
        userId,
        source: "browser",
        ...(from || to
          ? { startTime: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
          : {}),
      },
      orderBy: { startTime: "asc" },
      take: 500,
    });
  },

  async summary(
    userId: string,
    from?: Date,
    to?: Date,
    tzOffsetMinutes = 0
  ) {
    const [rows, overrides] = await Promise.all([
      prisma.activity.findMany({
        where: {
          userId,
          source: "browser",
          ...(from || to
            ? { startTime: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
            : {}),
        },
        select: {
          id: true,
          application: true,
          category: true,
          startTime: true,
          endTime: true,
          duration: true,
        },
        orderBy: { startTime: "desc" },
        take: SUMMARY_TAKE,
      }),
      getUserOverrides(userId),
    ]);

    return summarizeActivities(rows, { from, to, tzOffsetMinutes, overrides });
  },

  /** User-category overrides (future: re-categorize a website). */
  async setCategoryOverride(
    userId: string,
    website: string,
    category: ActivityCategory
  ): Promise<void> {
    const domain = normalizeDomain(website);
    if (!domain) throw new AppError(400, "Invalid domain.");
    await prisma.categoryOverride.upsert({
      where: { userId_website: { userId, website: domain } },
      update: { category },
      create: { userId, website: domain, category },
    });
  },

  async removeCategoryOverride(userId: string, website: string): Promise<void> {
    const domain = normalizeDomain(website);
    if (!domain) throw new AppError(400, "Invalid domain.");
    await prisma.categoryOverride.deleteMany({ where: { userId, website: domain } });
  },
};