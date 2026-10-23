/**
 * Local email/password sign-in (self-hosted Better Auth).
 *
 * Enabled (`true`). Public Better Auth sign-up stays disabled (`disableSignUp: true`).
 * The initial administrator uses the guarded one-time login-page bootstrap; additional
 * staff accounts are provisioned via CLI (`scripts/provision-staff.ts`).
 */
export const emailAndPasswordEnabled = true;
