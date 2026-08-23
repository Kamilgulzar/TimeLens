import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { activityService } from "../services/activity.service";
import { handleError } from "../utils/http";
import {
  categoryOverrideSchema,
  submitActivitiesSchema,
} from "../utils/validation";

function parseRange(query: Record<string, unknown>) {
  const from = typeof query.from === "string" && query.from ? new Date(query.from) : undefined;
  const to = typeof query.to === "string" && query.to ? new Date(query.to) : undefined;
  const validFrom = from && !Number.isNaN(from.getTime()) ? from : undefined;
  const validTo = to && !Number.isNaN(to.getTime()) ? to : undefined;

  let tzOffsetMinutes = 0;
  if (typeof query.tzOffsetMinutes === "string" || typeof query.tzOffsetMinutes === "number") {
    const parsed = Number(query.tzOffsetMinutes);
    if (Number.isFinite(parsed)) {
      tzOffsetMinutes = Math.max(-720, Math.min(840, Math.round(parsed)));
    }
  }
  return { from: validFrom, to: validTo, tzOffsetMinutes };
}

export const activityController = {
  async submit(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parsed = submitActivitiesSchema.parse(req.body);
      const result = await activityService.submit(req.userId as string, parsed.events);
      res.status(201).json(result);
    } catch (error) {
      handleError(res, error);
    }
  },

  async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { from, to } = parseRange(req.query as Record<string, unknown>);
      const activities = await activityService.list(req.userId as string, from, to);
      res.json({
        activities: activities.map((a) => ({
          id: a.id,
          website: a.application,
          category: a.category,
          startTime: a.startTime.toISOString(),
          endTime: a.endTime.toISOString(),
          duration: a.duration,
        })),
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async summary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { from, to, tzOffsetMinutes } = parseRange(req.query as Record<string, unknown>);
      const summary = await activityService.summary(
        req.userId as string,
        from,
        to,
        tzOffsetMinutes
      );
      res.json(summary);
    } catch (error) {
      handleError(res, error);
    }
  },

  async setOverride(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data = categoryOverrideSchema.parse(req.body);
      const result = await activityService.setCategoryOverride(
        req.userId as string,
        data.website,
        data.category
      );
      res.json(result);
    } catch (error) {
      handleError(res, error);
    }
  },

  async removeOverride(req: AuthRequest, res: Response): Promise<void> {
    try {
      const website =
        typeof req.query.website === "string"
          ? req.query.website
          : (req.body?.website as string | undefined);
      if (!website) {
        res.status(400).json({ error: "website is required." });
        return;
      }
      await activityService.removeCategoryOverride(req.userId as string, website);
      res.json({ ok: true });
    } catch (error) {
      handleError(res, error);
    }
  },
};