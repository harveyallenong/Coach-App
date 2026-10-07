/** URL-safe slug from a display name, e.g. "Coach Ána Cruz!" → "coach-ana-cruz". */
export function slugify(input: string, maxLength = 40): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
  return slug || "coach";
}

/**
 * First candidate not in `taken`: base, base-2, base-3, …
 * `taken` should contain every existing slug that starts with `base`.
 */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
