export type StaffRole = "admin" | "editor";

export type StaffAction =
  | "vehicle.write"
  | "content.write"
  | "enquiry.read"
  | "enquiry.update"
  | "enquiry.delete"
  | "settings.write"
  | "staff.grant";

const EDITOR_ACTIONS: ReadonlySet<StaffAction> = new Set([
  "vehicle.write",
  "content.write",
  "enquiry.read",
  "enquiry.update",
]);

export function isStaffRole(value: unknown): value is StaffRole {
  return value === "admin" || value === "editor";
}

/** Shared catalog, not per-user rows. Role is checked after the session user id. */
export function can(role: StaffRole | null, action: StaffAction): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  return EDITOR_ACTIONS.has(action);
}
