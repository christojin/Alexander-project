/**
 * Generate a URL-safe slug from a string.
 * Handles Spanish characters (ñ, accented vowels).
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric
    .trim()
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-"); // Collapse multiple hyphens
}

/**
 * Generate a unique slug by appending a short random suffix.
 */
export function uniqueSlug(text: string): string {
  const base = slugify(text);
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}
