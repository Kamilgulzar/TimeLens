import { domainFromUrl } from "../lib/domain.js";
import { classifyDomain } from "../categorization/categories.js";
import type { ActivityCategory } from "../types/activity.js";

export interface TrackTarget {
  domain: string;
  category: ActivityCategory;
}

export function targetFromUrl(url: string | undefined): TrackTarget | null {
  const domain = domainFromUrl(url);
  if (!domain) return null;
  return { domain, category: classifyDomain(domain) };
}

/** The active tab of the most recently focused window. */
export async function getActiveTabTarget(): Promise<TrackTarget | null> {
  try {
    const tabs = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    return targetFromUrl(tabs[0]?.url);
  } catch {
    return null;
  }
}

export async function getTabTarget(tabId: number): Promise<TrackTarget | null> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return targetFromUrl(tab.url);
  } catch {
    return null;
  }
}