export type GroupKey =
  | "development"
  | "research"
  | "productivity"
  | "social"
  | "entertainment"
  | "others";

export const GROUPS: { key: GroupKey; label: string; color: string }[] = [
  { key: "development", label: "Development", color: "#6D5DF6" },
  { key: "research", label: "Research", color: "#22C55E" },
  { key: "productivity", label: "Productivity", color: "#F59E0B" },
  { key: "social", label: "Social Media", color: "#EF4444" },
  { key: "entertainment", label: "Entertainment", color: "#3B82F6" },
  { key: "others", label: "Others", color: "#8B919E" },
];

export const GROUP_BY_KEY = new Map(GROUPS.map((g) => [g.key, g]));

/** Map the server category set onto the six chart groups. */
const CATEGORY_TO_GROUP: Record<string, GroupKey> = {
  Development: "development",
  Work: "productivity",
  Communication: "others",
  Research: "research",
  Learning: "research",
  Productivity: "productivity",
  "AI / Research": "research",
  Design: "productivity",
  Entertainment: "entertainment",
  "Social Media": "social",
  News: "others",
  Shopping: "others",
  Other: "others",
};

export function groupFor(category: string): GroupKey {
  return CATEGORY_TO_GROUP[category] ?? "others";
}

export function emptyGroupCounts(): Record<GroupKey, number> {
  return {
    development: 0,
    research: 0,
    productivity: 0,
    social: 0,
    entertainment: 0,
    others: 0,
  };
}