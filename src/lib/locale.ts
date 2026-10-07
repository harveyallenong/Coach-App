// Client-safe locale helpers (used by Zod schemas shared with forms).

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz.length > 0;
  } catch {
    return false;
  }
}

/** Currencies coaches may price in, with ISO 4217 minor-unit exponent. */
export const SUPPORTED_CURRENCIES = {
  PHP: 2,
  USD: 2,
  SGD: 2,
  AUD: 2,
  EUR: 2,
  GBP: 2,
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

export const CURRENCY_CODES = Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[];

export const COMMON_TIME_ZONES = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
] as const;
