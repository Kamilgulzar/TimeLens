/**
 * Normalize a raw URL/host into a bare domain for storage and analytics.
 *
 * Focuses on domain-level data per the product's privacy model: query strings,
 * paths, and fragments are never stored.
 */

export function normalizeDomain(input: string): string | null {
  if (!input) return null;

  let raw = input.trim().toLowerCase();
  if (!raw) return null;

  // Strip protocol/scheme.
  raw = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");

  // Strip credentials that may have leaked into a URL.
  if (raw.includes("@")) {
    const at = raw.indexOf("@");
    raw = raw.slice(at + 1);
  }

  // Strip port.
  raw = raw.replace(/:\d+/, "");

  // Strip leading www. subdomain (and common duplicates).
  raw = raw.replace(/^www\./, "");

  // Cut path, query, and fragment.
  raw = raw.split(/[/?#]/)[0];

  // Drop a trailing dot (FQDN).
  raw = raw.replace(/\.+$/, "");

  if (!raw) return null;

  const isHostname = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(raw);
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(raw);
  const isLocalhost = raw === "localhost";

  if (isHostname || isIpv4 || isLocalhost) {
    return raw;
  }
  return null;
}