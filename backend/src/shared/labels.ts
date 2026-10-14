/** A short, lower-case label made from a caption, used in [fig:label] and [tab:label] markers. */
export function labelFrom(caption: string) {
  const words = caption
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join("-");
  return words || "item";
}

export function uniqueLabel(wanted: string, taken: Set<string>) {
  const base = labelFrom(wanted).slice(0, 50);
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n += 1) if (!taken.has(`${base}-${n}`)) return `${base}-${n}`;
  return `${base}-${Date.now()}`;
}

export const LABEL_PATTERN = /^[A-Za-z0-9_-]{1,60}$/;
