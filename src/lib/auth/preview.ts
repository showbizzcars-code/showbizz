/**
 * Legacy allowlist for the original Grok preview OAuth flow.
 * This list is retained only while the authentication layer is being replaced;
 * it is not intended to authorize production callback hosts.
 */
export const PREVIEW_ALLOWED_HOSTS = ["*.grok-sandbox.com"] as const;
