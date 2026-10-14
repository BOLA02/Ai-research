import test from "node:test";
import assert from "node:assert/strict";
import { buildSourceEntries, citationWrap, findMarkers, formatSource, resolveText, type IndexedSource, type SourceData } from "./index";

const base: SourceData = { type: "BOOK", authors: [], editors: [], title: "" };
const person = (given: string, family: string) => ({ given, family });

// Examples below come from the Kaduna Polytechnic guidelines.
test("IEEE book", () =>
  assert.equal(
    formatSource({ ...base, authors: [person("I. A.", "Glover"), person("P. M.", "Grant")], title: "Digital Communications", edition: "3rd", place: "Harlow", publisher: "Prentice Hall", year: 2009 }, "IEEE"),
    "I. A. Glover and P. M. Grant, *Digital Communications*, 3rd ed. Harlow: Prentice Hall, 2009.",
  ));

test("IEEE journal article with more than six authors uses et al.", () =>
  assert.equal(
    formatSource(
      { ...base, type: "JOURNAL", authors: ["F. Yan", "Y. Gu", "Y. Wang", "C. M. Wang", "X. Y. Hu", "H. X. Peng", "Z. Q"].map((full) => { const [family, ...g] = full.split(" ").reverse(); return person(g.reverse().join(" "), family); }), title: "Study on the interaction mechanism between laser and rock during perforation", containerTitle: "Optics and Laser Technology", volume: "54", pages: "303-308", month: 12, year: 2013 },
      "IEEE",
    ),
    'F. Yan et al., "Study on the interaction mechanism between laser and rock during perforation," *Optics and Laser Technology*, vol. 54, pp. 303-308, Dec. 2013.',
  ));

test("IEEE conference paper", () =>
  assert.equal(
    formatSource({ ...base, type: "CONFERENCE", authors: [person("S.", "Adachi"), person("T.", "Horio"), person("T.", "Suzuki")], title: "Intense vacuum-ultraviolet single-order harmonic pulse by a deep-ultraviolet driving laser", containerTitle: "Conf. Lasers and Electro-Optics", place: "San Jose, CA", year: 2012, pages: "2118-2120" }, "IEEE"),
    'S. Adachi, T. Horio, and T. Suzuki, "Intense vacuum-ultraviolet single-order harmonic pulse by a deep-ultraviolet driving laser," in *Conf. Lasers and Electro-Optics*, San Jose, CA, 2012, pp. 2118-2120.',
  ));

test("IEEE patent", () =>
  assert.equal(
    formatSource({ ...base, type: "PATENT", authors: [person("J. P.", "Wilkinson")], title: "Nonlinear resonant circuit devices", place: "U.S.", number: "3 624 125", month: 7, day: 16, year: 1990 }, "IEEE"),
    'J. P. Wilkinson, "Nonlinear resonant circuit devices," U.S. Patent 3 624 125, Jul. 16, 1990.',
  ));

test("IEEE standard", () =>
  assert.equal(formatSource({ ...base, type: "STANDARD", title: "Shunt power capacitors", number: "IEEE standard 18-2012", year: 2013 }, "IEEE"), "Shunt power capacitors, IEEE standard 18-2012, 2013."));

test("IEEE thesis", () =>
  assert.equal(
    formatSource({ ...base, type: "THESIS", authors: [person("J. O.", "Williams")], title: "Narrow-band analyser", degree: "Ph.D. dissertation", institution: "Dept. Elect. Eng., Harvard Univ.", place: "Cambridge, MA", year: 1993 }, "IEEE"),
    'J. O. Williams, "Narrow-band analyser," Ph.D. dissertation, Dept. Elect. Eng., Harvard Univ., Cambridge, MA, 1993.',
  ));

test("IEEE website", () =>
  assert.equal(
    formatSource({ ...base, type: "WEBSITE", authors: [{ family: "BBC News" }], title: "Microwave signals turned into electrical power", year: 2013, month: 11, day: 11, url: "http://www.bbc.co.uk/news/technology-24897584" }, "IEEE"),
    "BBC News. (2013, Nov. 11). *Microwave signals turned into electrical power* [Online]. Available: http://www.bbc.co.uk/news/technology-24897584",
  ));

test("APA journal article with two authors", () =>
  assert.equal(
    formatSource({ ...base, type: "JOURNAL", authors: [person("A.", "Garofalo"), person("P.", "Dupuis")], title: "The impact of coercive false-confession evidence on mock juror perception", containerTitle: "Open Access Journal of Forensic Psychology", volume: "5", pages: "29-39", year: 2013, url: "www.forensicpsychologyunbound.ws/OAJFP/" }, "APA"),
    "Garofalo, A., & Dupuis, P. (2013). The impact of coercive false-confession evidence on mock juror perception. *Open Access Journal of Forensic Psychology, 5*, 29-39. Retrieved from www.forensicpsychologyunbound.ws/OAJFP/",
  ));

test("APA book with several authors", () =>
  assert.equal(
    formatSource({ ...base, authors: [person("S. A.", "Haslam"), person("S.", "Reicher"), person("M.", "Platow")], title: "The new psychology of leadership: Identity, influence, and power", place: "New York, NY", publisher: "Psychology Press", year: 2010 }, "APA"),
    "Haslam, S. A., Reicher, S., & Platow, M. (2010). *The new psychology of leadership: Identity, influence, and power*. New York, NY: Psychology Press.",
  ));

test("APA book with an edition", () =>
  assert.equal(
    formatSource({ ...base, authors: [person("V.", "Fromkin")], title: "An introduction to language", edition: "6th", place: "South Melbourne", publisher: "Cengage Learning Australia", year: 2009 }, "APA"),
    "Fromkin, V. (2009). *An introduction to language* (6th ed.). South Melbourne: Cengage Learning Australia.",
  ));

test("APA book chapter", () =>
  assert.equal(
    formatSource({ ...base, type: "BOOK_CHAPTER", authors: [person("P. N.", "Juslin")], editors: [person("S.", "Hallam"), person("I.", "Cross"), person("M.", "Thaut")], title: "Emotional responses to music", containerTitle: "The Oxford handbook of music psychology", pages: "377-389", place: "New York, NY", publisher: "Oxford University Press", year: 2008 }, "APA"),
    "Juslin, P. N. (2008). Emotional responses to music. In S. Hallam, I. Cross, & M. Thaut (Eds.), *The Oxford handbook of music psychology* (pp. 377-389). New York, NY: Oxford University Press.",
  ));

test("APA website with an organisation as author", () =>
  assert.equal(
    formatSource({ ...base, type: "WEBSITE", authors: [{ family: "American Psychological Association" }], title: "Ethical principles of psychologists and code of conduct", year: 2010, url: "http://apa.org/ethics/code/index.aspx" }, "APA"),
    "American Psychological Association. (2010). *Ethical principles of psychologists and code of conduct*. Retrieved from http://apa.org/ethics/code/index.aspx",
  ));

test("APA thesis", () =>
  assert.equal(
    formatSource({ ...base, type: "THESIS", authors: [person("C.", "Abdullahi")], title: "Peer responses to distressed students", degree: "HND II Research Project", institution: "Department of Local Government, Kaduna Polytechnic", place: "Kaduna, Nigeria", year: 2009 }, "APA"),
    "Abdullahi, C. (2009). *Peer responses to distressed students* (HND II Research Project, Department of Local Government, Kaduna Polytechnic, Kaduna, Nigeria).",
  ));

const sources: IndexedSource[] = [
  { ...base, id: "a", citeKey: "glover2009", authors: [person("I. A.", "Glover"), person("P. M.", "Grant")], title: "Digital Communications", year: 2009 },
  { ...base, id: "b", citeKey: "adachi2012", type: "CONFERENCE", authors: [person("S.", "Adachi")], title: "Pulse", containerTitle: "Conf", year: 2012 },
  { ...base, id: "c", citeKey: "unused", authors: [person("Z.", "Zed")], title: "Never cited", year: 2001 },
];
const blocks = [
  { id: "1", kind: "section" as const, title: "1.1", text: "First [@adachi2012]. Then [@glover2009, p. 33] and [@adachi2012]." },
  { id: "2", kind: "section" as const, title: "1.2", text: "Both [@glover2009; @adachi2012]." },
];

test("IEEE numbers sources by first appearance and lists uncited ones last", () => {
  const entries = buildSourceEntries("IEEE", sources, blocks);
  assert.deepEqual(entries.map((entry) => [entry.citeKey, entry.number]), [["adachi2012", 1], ["glover2009", 2], ["unused", null]]);
  assert.equal(entries[0].citationCount, 3);
});

test("APA lists sources alphabetically by first author", () => {
  const entries = buildSourceEntries("APA", sources, blocks);
  assert.deepEqual(entries.map((entry) => entry.citeKey), ["adachi2012", "glover2009", "unused"]);
});

test("resolveText turns markers into numbers or author-year citations", () => {
  const ieee = { style: "IEEE" as const, citationWrap: citationWrap("IEEE"), sources: buildSourceEntries("IEEE", sources, blocks), figures: [{ id: "f", label: "block", number: 1 }], tables: [] };
  assert.equal(resolveText("See [@glover2009, p. 33], [@adachi2012; @glover2009] and [fig:block], [tab:none].", ieee), "See [2, p. 33], [1, 2] and Figure 1, Table ?.");
  const apa = { ...ieee, style: "APA" as const, citationWrap: citationWrap("APA"), sources: buildSourceEntries("APA", sources, blocks) };
  assert.equal(resolveText("See [@glover2009, p. 33] and [@glover2009; @adachi2012].", apa), "See (Glover & Grant, 2009, p. 33) and (Glover & Grant, 2009; Adachi, 2012).");
});

test("findMarkers reads citations and figure references in order", () => {
  const markers = findMarkers("A [fig:x] then [@a; @b, p. 2].");
  assert.deepEqual(markers.map((marker) => marker.kind), ["fig", "cite"]);
});
