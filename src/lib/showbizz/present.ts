import { BRAND_NAME } from "./brand.ts";
import { whatsAppHref, type PublicSettings } from "./settings.ts";

export const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/showbizz_cars?igsh=ODJ5bGo2YTlwbm1x",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/showbizzcars.official?mibextid=ZbWKwL",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/roan-n-6305a3212?utm_source=share_via&utm_content=profile&utm_medium=member_android",
  },
] as const;

export function sameAs(settings: PublicSettings): string[] {
  return [
    ...SOCIAL_LINKS.map((profile) => profile.href),
    settings.xUrl,
    settings.youtubeUrl,
  ].filter((url): url is string => Boolean(url));
}

export function enquiryWhatsAppHref(settings: PublicSettings, vehicleTitle?: string): string | null {
  const text = vehicleTitle
    ? `Hello, I sent an enquiry on the ${BRAND_NAME} website about ${vehicleTitle}.`
    : `Hello, I sent an enquiry on the ${BRAND_NAME} website.`;
  return whatsAppHref(settings.whatsappE164, text);
}
