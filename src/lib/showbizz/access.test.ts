import assert from "node:assert/strict";
import { test } from "node:test";
import { can, isStaffRole } from "./access.ts";

test("isStaffRole validates admin and editor roles only", () => {
  assert.equal(isStaffRole("admin"), true);
  assert.equal(isStaffRole("editor"), true);
  assert.equal(isStaffRole("guest"), false);
  assert.equal(isStaffRole(null), false);
  assert.equal(isStaffRole(undefined), false);
});

test("can() permits admins all actions", () => {
  assert.equal(can("admin", "vehicle.write"), true);
  assert.equal(can("admin", "content.write"), true);
  assert.equal(can("admin", "enquiry.read"), true);
  assert.equal(can("admin", "enquiry.update"), true);
  assert.equal(can("admin", "enquiry.delete"), true);
  assert.equal(can("admin", "settings.write"), true);
  assert.equal(can("admin", "staff.grant"), true);
});

test("can() permits editors vehicle/content/enquiry actions but restricts settings and staff grant", () => {
  assert.equal(can("editor", "vehicle.write"), true);
  assert.equal(can("editor", "content.write"), true);
  assert.equal(can("editor", "enquiry.read"), true);
  assert.equal(can("editor", "enquiry.update"), true);

  assert.equal(can("editor", "enquiry.delete"), false);
  assert.equal(can("editor", "settings.write"), false);
  assert.equal(can("editor", "staff.grant"), false);
});

test("can() denies unauthenticated or non-staff users all actions", () => {
  assert.equal(can(null, "vehicle.write"), false);
  assert.equal(can(null, "settings.write"), false);
});
