import assert from "node:assert/strict";
import { test } from "node:test";
import { subscriptionWhatsAppHref, vehicleWhatsAppHref } from "./present.ts";

const settings = {
  whatsappE164: "+14155552671",
  publicEmail: null,
  publicPhone: null,
  address: null,
  instagramUrl: null,
  facebookUrl: null,
  xUrl: null,
  youtubeUrl: null,
};

test("vehicle WhatsApp enquiry includes the exact vehicle name and encodes message text", () => {
  const href = vehicleWhatsAppHref(settings, "Mercedes-Benz GLA");
  assert.ok(href);
  const url = new URL(href);
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, "/14155552671");
  assert.match(url.searchParams.get("text") ?? "", /Mercedes-Benz GLA/);
  assert.ok(url.searchParams.get("text")?.includes(" "));
});

test("subscription WhatsApp enquiry uses the configured number and a relevant message", () => {
  const href = subscriptionWhatsAppHref(settings);
  assert.ok(href);
  const url = new URL(href);
  assert.equal(url.pathname, "/14155552671");
  assert.match(url.searchParams.get("text") ?? "", /luxury car subscription/i);
});

test("WhatsApp enquiry helpers return no link when the business number is missing", () => {
  assert.equal(vehicleWhatsAppHref({ ...settings, whatsappE164: null }, "BMW X3"), null);
  assert.equal(subscriptionWhatsAppHref({ ...settings, whatsappE164: null }), null);
});
