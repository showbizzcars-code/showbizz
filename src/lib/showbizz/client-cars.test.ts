import assert from "node:assert/strict";
import { test } from "node:test";
import { CLIENT_CAR_CATALOG } from "./client-cars.ts";

test("client Cars tab catalogue preserves the 11 supplied model names in order", () => {
  assert.deepEqual(
    CLIENT_CAR_CATALOG.map((model) => model.title),
    [
      "BMW 2 Series",
      "BMW X3",
      "BMW 330Li",
      "BMW iX7",
      "Range Rover Defender",
      "Range Rover Sport",
      "Range Rover Velar",
      "Audi A6",
      "Mercedes-Benz GLA",
      "Jaguar XF",
      "Hycross Hybrid",
    ],
  );
});

test("client Cars tab catalogue slugs are unique and route-safe", () => {
  const slugs = CLIENT_CAR_CATALOG.map((model) => model.slug);
  assert.equal(new Set(slugs).size, CLIENT_CAR_CATALOG.length);
  for (const slug of slugs) {
    assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
});
