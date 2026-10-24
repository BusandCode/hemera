// Search helper for meals and restaurants. Case and punctuation don't matter, and every word
// typed must appear somewhere: "jollof rice" finds "Jollof Rice & Chicken", "mama rice" finds
// rice from Mama Titi's.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function searchMatch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const words = normalize(query).split(' ').filter(Boolean);
  if (words.length === 0) return true;
  const text = ' ' + normalize(fields.filter(Boolean).join(' ')) + ' ';
  return words.every((w) => text.includes(w));
}
