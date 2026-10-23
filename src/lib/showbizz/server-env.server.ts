/**
 * Server-only environment reads. Never return raw secret values.
 * There is no dotenv file: the platform injects these on deploy, and the
 * preview leaves them unset on purpose.
 */
export function imagePublicBaseUrl(): string | null {
  const raw = process.env.IMAGE_PUBLIC_BASE_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    const path = url.pathname.replace(/\/$/, "");
    return `${url.origin}${path}`;
  } catch {
    return null;
  }
}

export function publicImageUrl(storageKey: string): string | null {
  const base = imagePublicBaseUrl();
  if (!base) return null;
  if (!/^[a-zA-Z0-9/_.-]+$/.test(storageKey) || storageKey.includes("..")) return null;
  const encoded = storageKey
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${base}/${encoded}`;
}
