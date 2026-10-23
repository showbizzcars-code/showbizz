const BLOCKED = new Set([
  "phone",
  "email",
  "message",
  "contactName",
  "contact_name",
  "password",
  "token",
  "authorization",
  "database_url",
]);

/** Drop fields that could carry a person's contact details or a credential. */
export function redactFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (BLOCKED.has(key) || BLOCKED.has(key.toLowerCase())) continue;
    out[key] = value;
  }
  return out;
}
