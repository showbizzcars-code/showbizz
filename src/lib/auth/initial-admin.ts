import { createServerFn } from "@tanstack/react-start";

export type InitialAdminSetupStatus = {
  hasAdmin: boolean;
  tokenConfigured: boolean;
  tokenTooWeak: boolean;
  authEnabled: boolean;
  available: boolean;
};

export type InitialAdminRegistration = {
  name: string;
  email: string;
  password: string;
  setupToken: string;
};

/**
 * Public status check: only tells the login screen whether one-time setup can
 * be offered. It never exposes the configured token or any user information.
 */
export const getInitialAdminSetupStatus =
  createServerFn({ method: "GET" }).handler(async () => {
    const { readInitialAdminSetupStatus } = await import("./initial-admin.server");
    return readInitialAdminSetupStatus();
  });

/**
 * One-time bootstrap. The server validates the token and re-checks under a
 * transaction lock that an administrator has not already been created.
 */
export const registerInitialAdmin = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as InitialAdminRegistration)
  .handler(async ({ data }) => {
    const { assertSameSiteRequest } = await import("./isolation.server");
    assertSameSiteRequest();
    const { createInitialAdmin } = await import("./initial-admin.server");
    return createInitialAdmin(data);
  });
