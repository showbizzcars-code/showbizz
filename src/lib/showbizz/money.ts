/** Format a stored minor-unit daily rate. Returns null rather than guessing. */
export function formatDailyRate(minor: number, currency: string): string | null {
  if (!Number.isInteger(minor) || minor < 0) return null;
  if (!/^[A-Z]{3}$/.test(currency)) return null;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      currencyDisplay: "code",
    })
      .format(minor / 100)
      .replace(/\u00a0|\u202f/g, " ");
  } catch {
    return null;
  }
}
