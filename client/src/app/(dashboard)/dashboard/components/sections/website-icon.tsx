"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Official brand marks for well-known sites, keyed by normalized domain.
 * Unknown domains fall back to the neutral globe glyph when the icon fails
 * to load.
 */
const BRAND_ICONS: Record<string, string> = {
  "github.com": "https://github.com/favicon.ico",
  "gitlab.com": "https://gitlab.com/favicon.ico",
  "bitbucket.org": "https://wac-cdn.atlassian.com/assets/img/favicons/bitbucket/favicon-32.png",
  "stackoverflow.com": "https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico",
  "stackexchange.com": "https://cdn.sstatic.net/Sites/stackexchange/Img/favicon.ico",
  "chatgpt.com": "https://chatgpt.com/favicon.ico",
  "openai.com": "https://openai.com/favicon.ico",
  "claude.ai": "https://claude.ai/favicon.ico",
  "anthropic.com": "https://www.anthropic.com/favicon.ico",
  "x.com": "https://abs.twimg.com/icon/favicons/x.ico",
  "twitter.com": "https://abs.twimg.com/icon/favicons/x.ico",
  "youtube.com": "https://www.youtube.com/favicon.ico",
  "notion.so": "https://www.notion.so/front-static/favicon.ico",
  "notion.site": "https://www.notion.so/front-static/favicon.ico",
  "google.com": "https://www.google.com/favicon.ico",
  "gmail.com": "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico",
  "mail.google.com": "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico",
  "docs.google.com": "https://ssl.gstatic.com/docs/doclist/images/drive_2022.128x128.png",
  "sheets.google.com": "https://ssl.gstatic.com/docs/doclist/images/drive_2022.128x128.png",
  "slides.google.com": "https://ssl.gstatic.com/docs/doclist/images/drive_2022.128x128.png",
  "drive.google.com": "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png",
  "calendar.google.com": "https://ssl.gstatic.com/calendar/images/dynamicproduct_2020/calendar_32_2x.png",
  "meet.google.com": "https://www.gstatic.com/meet/google_meet_horizontal_wordmark_2020q4_2x.png",
  "figma.com": "https://static.figma.com/app/icon/1/favicon.svg",
  "figjam.com": "https://static.figma.com/app/icon/1/favicon.svg",
  "vercel.com": "https://vercel.com/favicon.ico",
  "vercel.app": "https://vercel.com/favicon.ico",
  "netlify.com": "https://www.netlify.com/v3/static/favicon/favicon-32x32.png",
  "react.dev": "https://react.dev/favicon-32x32.png",
  "nextjs.org": "https://nextjs.org/favicon.ico",
  "tailwindcss.com": "https://tailwindcss.com/favicon-32x32.png",
  "nodejs.org": "https://nodejs.org/static/images/favicons/favicon-32x32.png",
  "python.org": "https://www.python.org/static/favicon.ico",
  "docker.com": "https://www.docker.com/wp-content/uploads/2022/03/MicrosoftTeams-image-250x250.png",
  "prisma.io": "https://www.prisma.io/favicon.png",
  "npmjs.com": "https://static.npmjs.com/58a19602036db1daee0f7863c94673d24d0e0f91/static/images/touch-icons/favicon-32x32.png",
  "leetcode.com": "https://leetcode.com/static/images/LeetCode_avatar.png",
  "hackerrank.com": "https://www.hackerrank.com/favicon.ico",
  "replit.com": "https://replit.com/public/images/favicon.ico",
  "codesandbox.io": "https://codesandbox.io/favicon.ico",
  "codepen.io": "https://codepen.io/favicon.ico",
  "reddit.com": "https://www.redditstatic.com/desktop2x/img/favicon/apple-icon-57x57.png",
  "instagram.com": "https://www.instagram.com/static/images/ico/favicon-192.png",
  "facebook.com": "https://www.facebook.com/favicon.ico",
  "fb.com": "https://www.facebook.com/favicon.ico",
  "tiktok.com": "https://www.tiktok.com/favicon.ico",
  "pinterest.com": "https://s.pinimg.com/webapp/logo_trans_144_8f2f25f2.png",
  "linkedin.com": "https://static.licdn.com/sc/h/9lfodzvd7tpsp5saj1h4lr1qb",
  "amazon.com": "https://www.amazon.com/favicon.ico",
  "netflix.com": "https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico",
  "spotify.com": "https://open.spotifycdn.com/cdn/images/favicon32.png",
  "soundcloud.com": "https://a-v2.sndcdn.com/assets/images/sc-icons/favicon-2c957cd5b2.ico",
  "vimeo.com": "https://vimeo.com/favicon.ico",
  "discord.com": "https://discord.com/assets/favicon.ico",
  "slack.com": "https://a.slack-edge.com/80588/marketing/img/icons/favicon-32.png",
  "zoom.us": "https://zoom.us/favicon.ico",
  "telegram.org": "https://telegram.org/img/tl_card_icon.png",
  "signal.org": "https://signal.org/apple-touch-icon.png",
  "office.com": "https://www.office.com/favicon.ico",
  "outlook.com": "https://outlook.live.com/favicon.ico",
  "trello.com": "https://trello.com/favicon.ico",
  "asana.com": "https://asana.com/favicon.ico",
  "linear.app": "https://linear.app/favicon.ico",
  "miro.com": "https://miro.com/favicon.ico",
  "wikipedia.org": "https://en.wikipedia.org/favicon.ico",
  "duckduckgo.com": "https://duckduckgo.com/favicon.ico",
  "bing.com": "https://www.bing.com/favicon.ico",
  "brave.com": "https://brave.com/favicon.ico",
  "wolframalpha.com": "https://www.wolframalpha.com/favicon.ico",
  "medium.com": "https://miro.medium.com/v2/resize:fill:64:64/1*sHhtYhaCe2Uc3IU0IgKwIQ.png",
  "quora.com": "https://qsf.cf2.quoracdn.net/-4-images.favicon_new.ico-26-07b57efc0cbf8bd6.ico",
  "salesforce.com": "https://www.salesforce.com/favicon.ico",
  "atlassian.com": "https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon-32.png",
  "jira.com": "https://wac-cdn.atlassian.com/assets/img/favicons/jira/favicon-32.png",
  "confluence.com": "https://wac-cdn.atlassian.com/assets/img/favicons/confluence/favicon-32.png",
  "codecademy.com": "https://www.codecademy.com/favicon.ico",
  "udemy.com": "https://www.udemy.com/favicon.ico",
  "udacity.com": "https://www.udacity.com/favicon.ico",
  "duolingo.com": "https://d35aaqx5ub95lt.cloudfront.net/favicon.ico",
  "khanacademy.org": "https://cdn.kastatic.org/images/favicon.ico",
  "freecodecamp.org": "https://www.freecodecamp.org/favicon.ico",
  "canva.com": "https://static.canva.com/static/images/canva-favicon-144.png",
  "behance.net": "https://www.behance.net/favicon.ico",
  "adobe.com": "https://www.adobe.com/favicon.ico",
  "dribbble.com": "https://cdn.dribbble.com/assets/favicon-3b25f46c0d9c6b4e2e6c0d5d1f0f8a3b.ico",
  "framer.com": "https://framerusercontent.com/images/favicons/favicon.ico",
  "ebay.com": "https://www.ebay.com/favicon.ico",
  "etsy.com": "https://www.etsy.com/images/2015/favicon/favicon.ico",
  "walmart.com": "https://www.walmart.com/favicon.ico",
  "target.com": "https://www.target.com/favicon.ico",
  "bestbuy.com": "https://www.bestbuy.com/favicon.ico",
  "homedepot.com": "https://www.homedepot.com/favicon.ico",
  "ikea.com": "https://www.ikea.com/favicon.ico",
  "shein.com": "https://img.shein.com/shein_favicon.ico",
  "zara.com": "https://www.zara.com/favicon.ico",
  "flipkart.com": "https://img.flipkart.com/favicon.ico",
  "daraz.pk": "https://static.daraz.pk/favicon.ico",
  "bbc.com": "https://www.bbc.com/favicon.ico",
  "bbc.co.uk": "https://www.bbc.co.uk/favicon.ico",
  "cnn.com": "https://www.cnn.com/favicon.ico",
  "nytimes.com": "https://www.nytimes.com/favicon.ico",
  "theguardian.com": "https://www.theguardian.com/favicon.ico",
  "washingtonpost.com": "https://www.washingtonpost.com/favicon.ico",
  "reuters.com": "https://www.reuters.com/favicon.ico",
  "apnews.com": "https://apnews.com/favicon.ico",
  "bloomberg.com": "https://www.bloomberg.com/favicon.ico",
  "foxnews.com": "https://www.foxnews.com/favicon.ico",
  "msnbc.com": "https://www.msnbc.com/favicon.ico",
  "cnbc.com": "https://www.cnbc.com/favicon.ico",
  "theverge.com": "https://www.theverge.com/favicon.ico",
  "wired.com": "https://www.wired.com/favicon.ico",
  "arstechnica.com": "https://arstechnica.com/favicon.ico",
  "techcrunch.com": "https://techcrunch.com/favicon.ico",
  "engadget.com": "https://id.techhive.com/wp-content/themes/idg-proveit/images/favicon.ico",
  "economist.com": "https://www.economist.com/favicon.ico",
  "news.ycombinator.com": "https://news.ycombinator.com/favicon.ico",
  "coursera.org": "https://d3njjcbhbojbot.cloudfront.net/api/utilities/get/64/?desktoplogosvg/dario/",
  "pluralsight.com": "https://pluralsight.imgix.net/s/about/favicons/favicon.ico",
  "skillshare.com": "https://www.skillshare.com/favicon.ico",
  "excalidraw.com": "https://excalidraw.com/favicon-32x32.png",
  "lucid.app": "https://lucid.app/favicon.ico",
  "grammarly.com": "https://www.grammarly.com/favicon.ico",
};

function brandIconFor(domain: string): string | undefined {
  const d = domain.trim().toLowerCase().replace(/\.+$/, "");
  const exact = BRAND_ICONS[d];
  if (exact) return exact;
  const baseMatch = d.match(/[^.]+\.\w+$/);
  return baseMatch ? BRAND_ICONS[baseMatch[0]] : undefined;
}

export function WebsiteIcon({
  domain,
  size = 20,
  className,
}: {
  domain: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const brand = !failed ? brandIconFor(domain) : undefined;

  if (!brand) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-[5px] bg-muted text-muted-foreground",
          className
        )}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <Globe style={{ width: size * 0.7, height: size * 0.7 }} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brand}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-[5px] object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}