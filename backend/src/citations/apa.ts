import { MONTHS_LONG, clean, initials, isOrganisation, joinList, stop } from "./names";
import type { Author, SourceData } from "./types";

const listName = (author: Author) => (isOrganisation(author) ? author.family : `${author.family}, ${initials(author.given)}`);
const editorName = (author: Author) => (author.given ? `${initials(author.given)} ${author.family}` : author.family);

export function apaAuthors(authors: Author[]) {
  if (authors.length === 0) return "";
  if (authors.length === 1) return listName(authors[0]);
  if (authors.length <= 7) return `${authors.slice(0, -1).map(listName).join(", ")}, & ${listName(authors[authors.length - 1])}`;
  return `${authors.slice(0, 6).map(listName).join(", ")}, . . . ${listName(authors[authors.length - 1])}`;
}

const dateText = (source: SourceData, withDay: boolean) => {
  if (!source.year) return "n.d.";
  if (!withDay || !source.month) return String(source.year);
  return `${source.year}, ${MONTHS_LONG[source.month - 1]}${source.day ? ` ${source.day}` : ""}`;
};

const editionText = (value?: string | null) => {
  const text = clean(value);
  if (!text) return "";
  return `(${/ed\.?$/i.test(text) ? text : `${text} ed.`})`;
};

/** DOI first, otherwise the address. Empty when neither is given. */
const link = (source: SourceData) => (source.doi ? `doi:${clean(source.doi)}` : clean(source.url) ? `Retrieved from ${clean(source.url)}` : "");

const sentence = (parts: (string | undefined | false)[]) => parts.filter(Boolean).join(" ").trim();

/** APA reference-list entry, following the style in the department guide. Asterisks mark italics. */
export function formatApa(source: SourceData): string {
  const authors = apaAuthors(source.authors);
  const title = clean(source.title);
  const container = clean(source.containerTitle);
  const place = clean(source.place);
  const publisher = clean(source.publisher);
  const pages = clean(source.pages);
  const placePublisher = [place, publisher].filter(Boolean).join(": ");
  const organisation = clean(source.institution);
  const date = `(${dateText(source, source.type === "WEBSITE")}).`;
  const lead = authors ? stop(authors) : "";
  // With no author, the title takes the author's place at the start of the entry.
  const entry = (shownTitle: string) => (authors ? sentence([lead, date, stop(shownTitle)]) : sentence([stop(shownTitle), date]));

  switch (source.type) {
    case "JOURNAL": {
      const volume = clean(source.volume);
      const issue = clean(source.issue) ? `(${clean(source.issue)})` : "";
      const journal = container && `*${container}${volume ? `, ${volume}` : ""}*${issue}`;
      const where = [journal, pages].filter(Boolean).join(", ");
      return sentence([entry(title), where && stop(where), link(source)]);
    }
    case "BOOK": {
      const edition = editionText(source.edition);
      return sentence([entry(`*${title}*${edition ? ` ${edition}` : ""}`), placePublisher && stop(placePublisher), link(source)]);
    }
    case "BOOK_CHAPTER": {
      const editors = source.editors.length ? `${joinList(source.editors.map(editorName), "&", true)} (${source.editors.length > 1 ? "Eds." : "Ed."}), ` : "";
      const book = `*${container}*${editionText(source.edition) ? ` ${editionText(source.edition)}` : ""}${pages ? ` (pp. ${pages})` : ""}`;
      return sentence([entry(title), `In ${editors}${stop(book)}`, placePublisher && stop(placePublisher), link(source)]);
    }
    case "CONFERENCE":
      return sentence([entry(title), `In *${container}*${pages ? ` (pp. ${pages})` : ""}.`, place && stop(place), link(source)]);
    case "THESIS": {
      const detail = [clean(source.degree), organisation, place].filter(Boolean).join(", ");
      return sentence([entry(`*${title}* (${detail})`), link(source)]);
    }
    case "REPORT": {
      const number = clean(source.number) ? ` (Report No. ${clean(source.number)})` : "";
      return sentence([entry(`*${title}*${number}`), [place, organisation || publisher].filter(Boolean).join(": ") && stop([place, organisation || publisher].filter(Boolean).join(": ")), link(source)]);
    }
    case "STANDARD": {
      const owner = authors ? lead : stop(organisation || publisher);
      return sentence([owner, date, stop(`*${title}*${clean(source.number) ? ` (${clean(source.number)})` : ""}`), placePublisher && stop(placePublisher)]);
    }
    case "PATENT":
      return sentence([entry(`*${title}*`), stop(`${place || "U.S."} Patent No. ${clean(source.number)}`), publisher && stop(publisher)]);
    case "WEBSITE": {
      const owner = authors ? lead : organisation ? stop(organisation) : "";
      return sentence([owner, date, stop(`*${title}*`), link(source)]);
    }
    default:
      return sentence([entry(title), container && stop(container), link(source)]);
  }
}

/** The part inside the brackets of an in-text citation, e.g. "Smith & Lee, 2010" or "Okafor et al., 2018". */
export function apaInTextCore(source: SourceData) {
  const { authors } = source;
  const year = source.year ? String(source.year) : "n.d.";
  let who: string;
  if (authors.length === 0) who = `"${clean(source.title).split(/\s+/).slice(0, 4).join(" ")}"`;
  else if (authors.length === 1) who = authors[0].family;
  else if (authors.length === 2) who = `${authors[0].family} & ${authors[1].family}`;
  else who = `${authors[0].family} et al.`;
  return `${who}, ${year}`;
}
