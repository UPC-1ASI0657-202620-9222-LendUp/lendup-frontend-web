export function universityForEmail<
  T extends { emailDomains: readonly string[] },
>(email: string, universities: readonly T[]): T | undefined {
  const normalized = email.trim().toLowerCase();
  const at = normalized.indexOf('@');
  if (at < 1 || at !== normalized.lastIndexOf('@')) return undefined;
  const domain = normalized.slice(at + 1);
  return universities.find((university) =>
    university.emailDomains.includes(domain),
  );
}
