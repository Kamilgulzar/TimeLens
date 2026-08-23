/**
 * Normalize a URL into a bare domain. Mirrors server/src/lib/domain.ts.
 * Query strings, paths, and fragments are never stored.
 */

export function normalizeDomain(input: string): string | null {
  if (!input) return null;

  let raw = input.trim().toLowerCase();
  if (!raw) return null;

  raw = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");

  if (raw.includes("@")) {
    raw = raw.slice(raw.indexOf("@") + 1);
  }

  raw = raw.replace(/:\d+/, "");
  raw = raw.replace(/^www\./, "");
  raw = raw.split(/[/?#]/)[0];
  raw = raw.replace(/\.+$/, "");

  if (!raw) return null;

  const isHostname =
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(raw);
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(raw);
  const isLocalhost = raw === "localhost";

  if (isHostname || isIpv4 || isLocalhost) return raw;
  return null;
}

/** Return a normalized domain for a URL string, or null if it isn't trackable. */
export function domainFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
  } catch {
    return null;
  }
  return normalizeDomain(url);
}