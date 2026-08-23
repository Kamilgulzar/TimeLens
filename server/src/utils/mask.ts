export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;

  const visible = local.slice(0, 2);
  const stars = "*".repeat(Math.max(local.length - 2, 0));
  return `${visible}${stars}@${domain}`;
}
