export const BRAND_NAME = "Showbizz Cars";

export const DEFAULT_DESCRIPTION =
  "Showbizz Cars lists rental cars and accepts booking enquiries. Availability is set by the team. An enquiry is not a confirmed reservation, and this site does not take payment.";

export const PUBLIC_SETTING_KEYS = [
  "whatsapp_e164",
  "public_email",
  "public_phone",
  "address",
  "instagram_url",
  "facebook_url",
  "x_url",
  "youtube_url",
] as const;

export type PublicSettingKey = (typeof PUBLIC_SETTING_KEYS)[number];

export const ENQUIRY_HOURLY_LIMIT = 5;
export const ENQUIRY_IP_HOURLY_LIMIT = 20;
