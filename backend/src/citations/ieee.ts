import { MONTHS_IEEE, clean, initials, joinList, stop } from "./names";
import type { Author, SourceData } from "./types";

const name = (author: Author) => (author.given ? `${initials(author.given)} ${author.family}` : author.family);

export function ieeeAuthors(authors: Author[]) {
  if (authors.length === 0) return "";
  if (authors.length > 6) return `${name(authors[0])} et al.`;
  return joinList(authors.map(name), "and", true);
}

const withEd = (edition?: string | null) => {
  const value = clean(edition);
  if (!value) return "";
  return /ed\.?$/i.test(value) ? value : `${value} ed.`;
};

const pageText = (pages?: string | null) => {
  const value = clean(pages);
  if (!value) return "";
  return /[-–,]/.test(value) ? `pp. ${value.replace("–", "-")}` : `p. ${value}`;
};

/** "Jul. 16, 1990" or "Dec. 2013" or "2013". */
const shortDate = (source: SourceData) => {
  const month = source.month ? MONTHS_IEEE[source.month - 1] : "";
  const day = month && source.day ? `${source.day},` : "";
  return [month, day, source.year ?? ""].filter(Boolean).join(" ");
};

/** Joins fragments with commas and ends the entry with a full stop. */
const commas = (parts: (string | undefined | false)[]) => stop(parts.filter(Boolean).join(", "));

/** IEEE reference-list entry. Text between asterisks is italic. */
export function formatIeee(source: SourceData): string {
  const authors = ieeeAuthors(source.authors);
  const title = clean(source.title);
  const container = clean(source.containerTitle);
  const place = clean(source.place);
  const publisher = clean(source.publisher);
  const year = source.year ? String(source.year) : "n.d.";
  const quoted = `"${title},"`;
  const online = clean(source.url) && !source.doi ? ` [Online]. Available: ${clean(source.url)}` : "";
  const doi = source.doi ? `doi: ${clean(source.doi)}` : "";
  // A quoted title already carries its own comma, so it joins the next part with a space.
  const lead = authors ? `${authors}, ` : "";

  switch (source.type) {
    case "BOOK": {
      const placePublisher = [place, publisher].filter(Boolean).join(": ");
      return `${stop([authors, `*${title}*`, withEd(source.edition)].filter(Boolean).join(", "))} ${stop([placePublisher, year].filter(Boolean).join(", "))}`;
    }
    case "BOOK_CHAPTER": {
      const placePublisher = [place, publisher].filter(Boolean).join(": ");
      const editors = source.editors.length ? `${joinList(source.editors.map(name), "and", true)}, ${source.editors.length > 1 ? "Eds." : "Ed."}` : "";
      const inBook = [`in *${container}*`, withEd(source.edition), editors].filter(Boolean).join(", ");
      return `${lead}${quoted} ${stop(inBook)} ${commas([placePublisher, year, pageText(source.pages)])}`;
    }
    case "JOURNAL": {
      const vol = clean(source.volume) && `vol. ${clean(source.volume)}`;
      const issue = clean(source.issue) && `no. ${clean(source.issue)}`;
      return `${lead}${quoted} ${commas([container && `*${container}*`, vol, issue, pageText(source.pages), shortDate({ ...source, year: source.year ?? null }) || year, doi])}${online}`;
    }
    case "CONFERENCE":
      return `${lead}${quoted} ${commas([`in *${container}*`, place, year, pageText(source.pages)])}${online}`;
    case "REPORT":
      return `${lead}${quoted} ${commas([clean(source.institution), place, clean(source.number) && `Rep. ${clean(source.number)}`, year])}${online}`;
    case "PATENT":
      return `${lead}${quoted} ${commas([`${place || "U.S."} Patent ${clean(source.number)}`, shortDate(source)])}`;
    case "STANDARD":
      return commas([title, clean(source.number), year]);
    case "THESIS":
      return `${lead}${quoted} ${commas([clean(source.degree), clean(source.institution), place, year])}${online}`;
    case "WEBSITE": {
      const owner = authors || clean(source.institution);
      const when = source.year ? [source.year, [source.month ? MONTHS_IEEE[source.month - 1] : "", source.month ? source.day : ""].filter(Boolean).join(" ")].filter(Boolean).join(", ") : "";
      return [owner && `${stop(owner)}`, when && `(${when}).`, `*${title}*`].filter(Boolean).join(" ") + ` [Online]. Available: ${clean(source.url)}`;
    }
    default:
      return `${lead}${quoted} ${commas([container, year])}`;
  }
}

export const ieeeInTextCore = (number: number) => String(number);
