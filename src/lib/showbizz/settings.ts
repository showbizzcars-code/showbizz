import { PUBLIC_SETTING_KEYS, type PublicSettingKey } from "./brand.ts";
import { normalizePhone } from "./validate.ts";

export type PublicSettings = {
  whatsappE164: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  address: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  xUrl: string | null;
  youtubeUrl: string | null;
};

export const EMPTY_SETTINGS: PublicSettings = {
  whatsappE164: null,
  publicEmail: null,
  publicPhone: null,
  address: null,
  instagramUrl: null,
  facebookUrl: null,
  xUrl: null,
  youtubeUrl: null,
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function httpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function whatsAppHref(e164: string | null | undefined, text: string): string | null {
  if (!e164 || !/^\+[1-9]\d{7,14}$/.test(e164)) return null;
  const params = new URLSearchParams({ text });
  return `https://wa.me/${e164.slice(1)}?${params.toString()}`;
}

export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const normalized = normalizePhone(phone);
  if (!/^\+?\d{8,15}$/.test(normalized)) return null;
  return `tel:${normalized}`;
}

export function mailtoHref(email: string | null | undefined): string | null {
  if (!email || !EMAIL.test(email) || email.length > 120) return null;
  return `mailto:${email}`;
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export function publicSettingsFromRows(rows: { key: string; value: string }[]): PublicSettings {
  const bag = new Map<string, string>();
  for (const row of rows) {
    if ((PUBLIC_SETTING_KEYS as readonly string[]).includes(row.key)) bag.set(row.key, row.value);
  }
  const pick = (key: PublicSettingKey) => clean(bag.get(key));
  const phone = pick("public_phone");
  const normalizedPhone = phone ? normalizePhone(phone) : null;
  return {
    whatsappE164: pick("whatsapp_e164")?.match(/^\+[1-9]\d{7,14}$/) ? pick("whatsapp_e164") : null,
    publicEmail: mailtoHref(pick("public_email")) ? pick("public_email") : null,
    publicPhone: normalizedPhone && telHref(normalizedPhone) ? normalizedPhone : null,
    address: pick("address") && pick("address")!.length <= 500 ? pick("address") : null,
    instagramUrl: httpsUrl(pick("instagram_url")),
    facebookUrl: httpsUrl(pick("facebook_url")),
    xUrl: httpsUrl(pick("x_url")),
    youtubeUrl: httpsUrl(pick("youtube_url")),
  };
}
