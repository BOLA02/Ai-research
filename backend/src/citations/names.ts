import type { Author } from "./types";

export const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MONTHS_IEEE = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

/** "Jean-Paul Mary" becomes "J.-P. M." */
export function initials(given?: string) {
  if (!given) return "";
  return given
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split("-")
        .map((part) => (part ? `${part[0].toUpperCase()}.` : ""))
        .join("-"),
    )
    .join(" ");
}

export const isOrganisation = (author: Author) => !author.given;

/** Defensive parse for JSON read from the database. */
export function parseAuthors(value: unknown): Author[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({ family: String(item.family ?? "").trim(), given: item.given ? String(item.given).trim() : undefined }))
    .filter((author) => author.family);
}

export function joinList(items: string[], conjunction: string, oxford: boolean) {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}${oxford ? "," : ""} ${conjunction} ${items[items.length - 1]}`;
}

/** Ends a fragment with a full stop unless it already ends in punctuation. */
export const stop = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);
export const clean = (value?: string | null) => (value ? value.trim() : "");
