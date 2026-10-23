export function env(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/**
 * Legacy platform-preview detector retained for the auth compatibility layer.
 * Production hosting must not depend on this flag; self-hosted auth must be
 * migrated away from the Grok gate before it is enabled on the client domain.
 */
export function isWorkspacePreview(): boolean {
  return !env("GROK_PROJECT_ID");
}
