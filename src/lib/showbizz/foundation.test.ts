import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { can } from "./access.ts";
import { redactFields } from "./log.ts";
import { formatDailyRate } from "./money.ts";
import {
  availabilityLd,
  buildRobotsTxt,
  buildSitemapXml,
  metaDescription,
  rentalBusinessLd,
  xmlEscape,
} from "./seo.ts";
import { DEFAULT_WHATSAPP_E164, httpsUrl, publicSettingsFromRows, whatsAppHref } from "./settings.ts";
import {
  PUBLIC_FAQ_SQL,
  PUBLIC_POST_LIST_SQL,
  PUBLIC_TESTIMONIAL_SQL,
  PUBLIC_VEHICLE_BY_SLUG_SQL,
  PUBLIC_VEHICLE_LIST_SQL,
} from "./sql.ts";
import { imagePublicBaseUrl } from "./server-env.server.ts";
import { parseEnquiry, parseSlug } from "./validate.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("public SQL stays on published rows and never reads enquiries", () => {
  const statements = [
    PUBLIC_VEHICLE_LIST_SQL,
    PUBLIC_VEHICLE_BY_SLUG_SQL,
    PUBLIC_FAQ_SQL,
    PUBLIC_TESTIMONIAL_SQL,
    PUBLIC_POST_LIST_SQL,
  ];
  for (const sql of statements) {
    assert.match(sql, /status = 'published'/);
    assert.doesNotMatch(sql, /enquiry/i);
    assert.doesNotMatch(sql, /contact_name|phone|ip_hash/);
  }
});

test("migration creates the catalog and does not seed business rows", () => {
  const sql = readFileSync(join(root, "migrations/0002_showbizz.sql"), "utf8");
  for (const table of [
    "staff_member",
    "vehicle",
    "vehicle_image",
    "enquiry",
    "faq",
    "testimonial",
    "blog_post",
    "site_setting",
    "audit_event",
  ]) {
    assert.match(sql, new RegExp(`create table if not exists ${table}`));
  }
  assert.match(sql, /availability in \('available', 'unavailable', 'on_request'\)/);
  assert.doesNotMatch(sql, /insert into/i);
});

test("enquiry validation rejects incomplete, inverted, and honeypot submissions", () => {
  const ok = parseEnquiry({
    contactName: "Ada Lovelace",
    phone: "+44 7700 900123",
    email: "",
    message: "I would like to ask about a weekend.",
    startOn: "2026-11-01",
    endOn: "2026-11-03",
    vehicleSlug: "",
    companyWebsite: "",
  });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.value.phone, "+447700900123");

  assert.equal(
    parseEnquiry({
      contactName: "A",
      phone: "123",
      email: "",
      message: "too short",
      startOn: "",
      endOn: "",
      vehicleSlug: "",
      companyWebsite: "",
    }).ok,
    false,
  );

  const dates = parseEnquiry({
    contactName: "Ada Lovelace",
    phone: "07700900123",
    email: "ada@example.com",
    message: "Dates are the wrong way around.",
    startOn: "2026-12-02",
    endOn: "2026-12-01",
    vehicleSlug: "not a slug",
    companyWebsite: "",
  });
  assert.equal(dates.ok, false);

  const bot = parseEnquiry({
    contactName: "Ada Lovelace",
    phone: "+447700900123",
    email: "",
    message: "This is a normal looking message.",
    startOn: "",
    endOn: "",
    vehicleSlug: "",
    companyWebsite: "https://spam.example",
  });
  assert.equal(bot.ok, false);
});

test("slugs stay lowercase and bounded", () => {
  assert.equal(parseSlug("s-class-2024"), "s-class-2024");
  assert.equal(parseSlug("S-Class"), null);
  assert.equal(parseSlug("../admin"), null);
  assert.equal(parseSlug(""), null);
});

test("editors cannot grant staff or change settings", () => {
  assert.equal(can("editor", "vehicle.write"), true);
  assert.equal(can("editor", "enquiry.read"), true);
  assert.equal(can("editor", "staff.grant"), false);
  assert.equal(can("editor", "settings.write"), false);
  assert.equal(can("editor", "enquiry.delete"), false);
  assert.equal(can("admin", "staff.grant"), true);
  assert.equal(can(null, "enquiry.read"), false);
});

test("money, WhatsApp helpers, and default business WhatsApp settings are consistent", () => {
  assert.equal(formatDailyRate(125000, "INR"), "INR 1,250.00");
  assert.equal(formatDailyRate(-1, "INR"), null);
  assert.equal(formatDailyRate(100, "inr"), null);
  assert.equal(whatsAppHref(null, "Hello"), null);
  assert.equal(whatsAppHref("+14155552671", "Hello"), "https://wa.me/14155552671?text=Hello");
  assert.equal(httpsUrl("javascript:alert(1)"), null);
  const settings = publicSettingsFromRows([
    { key: "instagram_url", value: "http://insecure.example" },
    { key: "public_email", value: "not-an-email" },
    { key: "whatsapp_e164", value: "07700900123" },
    { key: "secret", value: "nope" },
  ]);
  assert.equal(settings.instagramUrl, null);
  assert.equal(settings.publicEmail, null);
  assert.equal(settings.whatsappE164, DEFAULT_WHATSAPP_E164);
  assert.equal(publicSettingsFromRows([]).whatsappE164, DEFAULT_WHATSAPP_E164);
  assert.equal(
    publicSettingsFromRows([{ key: "whatsapp_e164", value: "+447700900123" }]).whatsappE164,
    "+447700900123",
  );
});

test("sitemap and robots stay crawlable and credential-free", () => {
  const xml = buildSitemapXml("https://example.com", [
    { loc: "/vehicles/a-b", lastmod: "2026-10-01T00:00:00.000Z" },
  ]);
  assert.match(xml, /https:\/\/example\.com\/vehicles\/a-b/);
  assert.match(xml, /<lastmod>2026-10-01<\/lastmod>/);
  assert.equal(xmlEscape('a&b<"\'>'), ["a", "&" + "amp;", "b", "&" + "lt;", "&" + "quot;", "&" + "apos;", "&" + "gt;"].join(""));
  const robots = buildRobotsTxt("https://example.com");
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Disallow: \/admin/);
  assert.doesNotMatch(robots, /Disallow: \/\n/);
  assert.throws(() => buildSitemapXml("https://user:pass@example.com", [{ loc: "/" }]));
  const business = rentalBusinessLd(null, {
    publicPhone: null,
    publicEmail: null,
    address: null,
    sameAs: [],
  });
  assert.equal(business.name, "Showbizz Cars");
  assert.equal("address" in business, false);
  assert.equal("telephone" in business, false);
  assert.equal(availabilityLd("on_request"), "https://schema.org/LimitedAvailability");
  assert.equal(metaDescription("", "fallback"), "fallback");
});

test("image base URL rejects credentials and non-https values", () => {
  const previous = process.env.IMAGE_PUBLIC_BASE_URL;
  process.env.IMAGE_PUBLIC_BASE_URL = "https://user:secret@cdn.example/photos/";
  assert.equal(imagePublicBaseUrl(), null);
  process.env.IMAGE_PUBLIC_BASE_URL = "http://cdn.example/photos";
  assert.equal(imagePublicBaseUrl(), null);
  process.env.IMAGE_PUBLIC_BASE_URL = "https://cdn.example/photos/";
  assert.equal(imagePublicBaseUrl(), "https://cdn.example/photos");
  if (previous === undefined) delete process.env.IMAGE_PUBLIC_BASE_URL;
  else process.env.IMAGE_PUBLIC_BASE_URL = previous;
});

test("logs drop contact fields", () => {
  assert.deepEqual(redactFields({ id: "1", phone: "+1", message: "secret", email: "a@b.c" }), { id: "1" });
});
