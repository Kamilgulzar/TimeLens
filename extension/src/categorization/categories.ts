import type { ActivityCategory, CategoryKind } from "../types/activity.js";

/**
 * Default website classification rules.
 *
 * This mirrors server/src/constants/categories.ts. Keep the two files in sync.
 * Classification rules are data-driven so new websites can be added without
 * touching the tracking engine; a user-specific override table layers on top
 * (server-side) in a later iteration.
 */

export const CATEGORY_KIND: Record<ActivityCategory, CategoryKind> = {
  Development: "focus",
  Work: "focus",
  Research: "focus",
  Learning: "focus",
  Productivity: "focus",
  "AI / Research": "focus",
  Design: "focus",
  Communication: "neutral",
  Other: "neutral",
  Entertainment: "distract",
  "Social Media": "distract",
  News: "distract",
  Shopping: "distract",
};

/** First rule that matches wins; more specific domains come first. */
const CATEGORY_RULES: { category: ActivityCategory; domains: string[] }[] = [
  {
    category: "Development",
    domains: [
      "localhost", "127.0.0.1", "0.0.0.0", "local",
      "github.com", "gitlab.com", "bitbucket.org", "stackoverflow.com",
      "stackexchange.com", "stackblitz.com", "codesandbox.io", "codepen.io",
      "replit.com", "glitch.com", "npmjs.com", "pnpm.io", "yarnpkg.com",
      "vercel.com", "vercel.app", "netlify.com", "netlify.app", "railway.app",
      "herokuapp.com", "supabase.com", "firebase.google.com", "firebaseapp.com",
      "developer.mozilla.org", "react.dev", "nextjs.org", "tailwindcss.com",
      "typescriptlang.org", "nodejs.org", "python.org", "docker.com",
      "kubernetes.io", "postgresql.org", "prisma.io", "vitejs.dev",
      "webpack.js.org", "code.visualstudio.com", "w3schools.com", "leetcode.com",
      "hackerrank.com", "codewars.com", "exercism.org",
    ],
  },
  {
    category: "Work",
    domains: [
      "workday.com", "salesforce.com", "zendesk.com", "atlassian.com",
      "jira.com", "confluence.com", "office.com", "sharepoint.com",
      "onedrive.com", "outlook.office.com", "lattice.com",
    ],
  },
  {
    category: "Communication",
    domains: [
      "gmail.com", "outlook.com", "mail.google.com", "yahoo.com", "proton.me",
      "protonmail.com", "zoho.com", "slack.com", "discord.com", "zoom.us",
      "teams.microsoft.com", "messenger.com", "signal.org", "telegram.org",
      "whatsapp.com", "webex.com", "meet.google.com", "hangouts.google.com",
    ],
  },
  {
    category: "Research",
    domains: [
      "google.com", "duckduckgo.com", "bing.com", "brave.com", "wikipedia.org",
      "wiktionary.org", "wolframalpha.com", "arxiv.org", "scholar.google.com",
      "sciencedirect.com", "researchgate.net", "nature.com", "quora.com",
    ],
  },
  {
    category: "AI / Research",
    domains: [
      "chatgpt.com", "openai.com", "claude.ai", "anthropic.com",
      "gemini.google.com", "bard.google.com", "aistudio.google.com", "poe.com",
      "you.com", "grok.com", "x.ai", "phind.com", "perplexity.ai",
      "huggingface.co", "kaggle.com", "civitai.com",
    ],
  },
  {
    category: "Learning",
    domains: [
      "coursera.org", "udemy.com", "edx.org", "khanacademy.org",
      "codecademy.com", "freecodecamp.org", "pluralsight.com", "skillshare.com",
      "udacity.com", "duolingo.com", "brilliant.org", "sololearn.com",
      "learn.microsoft.com", "medium.com",
    ],
  },
  {
    category: "Productivity",
    domains: [
      "notion.so", "notion.site", "evernote.com", "trello.com", "todoist.com",
      "ticktick.com", "asana.com", "clickup.com", "linear.app", "obsidian.md",
      "roamresearch.com", "onenote.com", "calendar.google.com",
      "docs.google.com", "sheets.google.com", "slides.google.com",
      "drive.google.com", "dropbox.com", "miro.com", "excalidraw.com",
      "lucid.app", "grammarly.com",
    ],
  },
  {
    category: "Design",
    domains: [
      "figma.com", "figjam.com", "framer.com", "dribbble.com", "behance.net",
      "adobe.com", "canva.com", "sketch.com", "zeplin.io", "invisionapp.com",
      "penpot.app",
    ],
  },
  {
    category: "Entertainment",
    domains: [
      "youtube.com", "netflix.com", "twitch.tv", "spotify.com",
      "soundcloud.com", "pandora.com", "deezer.com", "primevideo.com",
      "disneyplus.com", "hulu.com", "hbomax.com", "max.com", "crunchyroll.com",
      "vimeo.com", "plex.tv", "imdb.com", "metacritic.com", "tv.apple.com",
      "steamcommunity.com", "store.steampowered.com",
    ],
  },
  {
    category: "Social Media",
    domains: [
      "facebook.com", "fb.com", "instagram.com", "twitter.com", "x.com",
      "tiktok.com", "reddit.com", "linkedin.com", "t.co", "threads.net",
      "snapchat.com", "pinterest.com", "tumblr.com",
    ],
  },
  {
    category: "News",
    domains: [
      "bbc.com", "bbc.co.uk", "cnn.com", "nytimes.com", "theguardian.com",
      "washingtonpost.com", "reuters.com", "apnews.com", "bloomberg.com",
      "foxnews.com", "msnbc.com", "cnbc.com", "theverge.com", "wired.com",
      "arstechnica.com", "techcrunch.com", "engadget.com", "economist.com",
      "news.ycombinator.com",
    ],
  },
  {
    category: "Shopping",
    domains: [
      "amazon.com", "amazon.co.uk", "amazon.de", "amazon.in", "amazon.ca",
      "ebay.com", "aliexpress.com", "alibaba.com", "etsy.com", "walmart.com",
      "target.com", "bestbuy.com", "homedepot.com", "ikea.com", "shein.com",
      "zara.com", "flipkart.com", "daraz.pk",
    ],
  },
];

export function classifyDomain(domain: string): ActivityCategory {
  const d = domain.trim().toLowerCase().replace(/\.+$/, "");
  for (const rule of CATEGORY_RULES) {
    for (const match of rule.domains) {
      if (d === match || d.endsWith(`.${match}`)) {
        return rule.category;
      }
    }
  }
  return "Other";
}