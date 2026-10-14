import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { FORMAT } from "../../templates/eee-hnd";
import { buildDocx } from "./docx-builder";
import type { ExportModel } from "./export.model";
import { awardFor, chapterWord, departmentLine, fillBlanks, fit, imageSize, italicPieces, parseUnits, styledPieces, toParagraphs, toRoman } from "./export.util";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

const model: ExportModel = {
  title: "Test Project", style: "IEEE", format: FORMAT, award: "HIGHER NATIONAL DIPLOMA", institution: "Kaduna Polytechnic", location: "Kaduna",
  department: "DEPARTMENT OF ELECTRICAL AND ELECTRONIC ENGINEERING", college: "College of Engineering", school: "", studentName: "Musa Ibrahim",
  registrationNumber: "KPT/1", year: 2026,
  signatories: [{ role: "Project Supervisor", name: "Dr A" }, { role: "Head of Department", name: "Dr B" }],
  front: [
    { id: "d", type: "DECLARATION", title: "Declaration", text: "I, ______ declare under ______ supervision." },
    { id: "a", type: "ABSTRACT", title: "Abstract", text: "Short abstract." },
    { id: "t", type: "TABLE_OF_CONTENTS", title: "Table of Contents", text: "" },
    { id: "lf", type: "LIST_OF_FIGURES", title: "List of Figures", text: "" },
  ],
  chapters: [{ id: "c1", number: 1, title: "Introduction", sections: [{ id: "s1", number: "1.1", title: "Background", depth: 1, body: [{ t: "text", text: "First paragraph.\n\nSecond paragraph." }, { t: "calc", calc: { id: "k", title: "Filter capacitor", lines: ["C = I / (2 × f × V_r) = 0.1 / (2 × 50 × 1) = 1 mF", "Chosen: 1000 µF"] } }], figures: [{ id: "f1", number: 1, caption: "A picture", source: null, image: { data: png, type: "png", width: 1, height: 1 } }], tables: [{ id: "t1", number: 1, caption: "A table", source: "Measured", columns: ["A", "B"], rows: [["1", "2"]] }] }] }],
  references: [{ citeKey: "a", number: 1, formatted: "A. Author, *A Book*. City: Pub, 2020." }],
  appendices: [{ id: "x", title: "Code listing", text: "int main() {}" }],
  figures: [{ id: "f1", number: 1, caption: "A picture" }], tables: [{ id: "t1", number: 1, caption: "A table" }],
};

async function parts() {
  const zip = await JSZip.loadAsync(await buildDocx(model));
  const document = await zip.file("word/document.xml")!.async("string");
  const settings = await zip.file("word/settings.xml")!.async("string");
  const headers = await Promise.all(Object.keys(zip.files).filter((name) => name.startsWith("word/header")).map((name) => zip.file(name)!.async("string")));
  const footers = await Promise.all(Object.keys(zip.files).filter((name) => name.startsWith("word/footer")).map((name) => zip.file(name)!.async("string")));
  return { zip, document, settings, headers, footers };
}

test("the document follows the department's page format", async () => {
  const { document } = await parts();
  assert.match(document, /w:pgSz w:w="11906" w:h="16838"/, "A4");
  assert.match(document, /w:left="1417"/, "25 mm left margin");
  assert.match(document, /w:top="1134"/, "20 mm top margin");
  assert.match(document, /Times New Roman/);
  assert.match(document, /<w:pgNumType[^>]*w:fmt="lowerRoman"/, "roman front matter");
  assert.match(document, /<w:pgNumType[^>]*w:fmt="decimal"/, "arabic body");
  assert.equal((document.match(/<w:pgNumType[^>]*w:start="1"/g) ?? []).length, 2, "front matter and body each start at 1");
  assert.match(document, /w:titlePg/, "the title page shows no number");
});

test("body text is justified to both margins, as the guidelines require", async () => {
  const { document } = await parts();
  const paragraphs = document.match(/<w:p>.*?<\/w:p>/gs) ?? [];
  const containing = (text: string) => paragraphs.find((paragraph) => paragraph.includes(text))!;
  for (const text of ["First paragraph.", "Second paragraph.", "Short abstract.", "A. Author"])
    assert.match(containing(text), /<w:jc w:val="both"\/>/, `${text} is justified`);
  assert.doesNotMatch(containing("First paragraph."), /<w:jc w:val="left"/);
});

test("page numbers sit in the top right header", async () => {
  const { headers } = await parts();
  assert.ok(headers.some((xml) => xml.includes('w:val="right"') && xml.includes("PAGE")));
});

test("chapters start on a new page and the cover uses capitals", async () => {
  const { document } = await parts();
  assert.match(document, /CHAPTER ONE/);
  assert.match(document, /w:pageBreakBefore/);
  assert.match(document, /TEST PROJECT/);
  assert.match(document, /HIGHER NATIONAL DIPLOMA/);
});

test("figures, tables, captions, references and appendices are included", async () => {
  const { document, zip } = await parts();
  assert.match(document, /Figure 1: A picture/);
  assert.match(document, /Table 1: A table/);
  assert.match(document, /Source: Measured/);
  assert.match(document, /\[1\]/);
  assert.match(document, /APPENDIX I: CODE LISTING/);
  assert.ok(Object.keys(zip.files).some((name) => name.startsWith("word/media/")), "the image is embedded");
});

test("the table of contents is built from bookmarks and asks Word to refresh page numbers", async () => {
  const { document, settings } = await parts();
  assert.match(document, /PAGEREF/);
  assert.match(document, /w:bookmarkStart/);
  assert.match(settings, /w:updateFields/);
});

test("a calculation is written out line by line with lowered subscripts", async () => {
  const { document } = await parts();
  assert.match(document, /Filter capacitor/);
  assert.match(document, /C = I \/ \(2 × f × /);
  assert.match(document, /<w:vertAlign w:val="subscript"\/>[\s\S]{0,200}<w:t[^>]*>r<\/w:t>/);
  assert.match(document, /Chosen: 1000 µF/);
  assert.match(document, /<w:keepNext\/>/);
});

test("the declaration is filled from the project details", async () => {
  const { document } = await parts();
  assert.match(document, /I, Musa Ibrahim declare under Dr A supervision/);
});

test("helpers", () => {
  assert.equal(chapterWord(3), "THREE");
  assert.equal(toRoman(4), "IV");
  assert.equal(toRoman(9), "IX");
  assert.equal(fillBlanks("a _____ b _____ c", ["X", undefined]), "a X b _____ c");
  assert.deepEqual(toParagraphs("a\nb\n\n\nc"), [["a", "b"], ["c"]]);
  assert.deepEqual(italicPieces("x *y* z"), [{ text: "x ", italics: false }, { text: "y", italics: true }, { text: " z", italics: false }]);
  assert.equal(departmentLine("Electrical and Electronic Engineering"), "DEPARTMENT OF ELECTRICAL AND ELECTRONIC ENGINEERING");
  assert.equal(departmentLine("Department of Chemical Engineering"), "DEPARTMENT OF CHEMICAL ENGINEERING");
  assert.equal(awardFor("HND"), "HIGHER NATIONAL DIPLOMA");
  assert.deepEqual(imageSize(png), { width: 1, height: 1, type: "png" });
  assert.equal(imageSize(Buffer.from("not an image at all, really not")), null);
  assert.deepEqual(fit(2000, 1000, 500, 500), { width: 500, height: 250 });
  assert.deepEqual(fit(100, 50, 500, 500), { width: 100, height: 50 });
});

test("styledPieces reads bold, italic and underline marks", () => {
  const plain = { bold: false, italics: false, underline: false };
  assert.deepEqual(styledPieces("a **b** *c* ++d++ e"), [
    { text: "a ", ...plain }, { text: "b", ...plain, bold: true }, { text: " ", ...plain }, { text: "c", ...plain, italics: true },
    { text: " ", ...plain }, { text: "d", ...plain, underline: true }, { text: " e", ...plain },
  ]);
  assert.deepEqual(styledPieces("***both***"), [{ text: "both", bold: true, italics: true, underline: false }]);
  // Unclosed marks and marks across lines stay as typed.
  assert.deepEqual(styledPieces("only **open here"), [{ text: "only **open here", ...plain }]);
});

test("page numbers: roman front matter, and first pages of chapters at the bottom centre", async () => {
  const { document, footers, headers } = await parts();
  assert.ok(footers.some((xml) => xml.includes('w:val="center"') && xml.includes("PAGE")), "a centred page number footer exists");
  assert.ok(headers.some((xml) => xml.includes('w:val="right"') && xml.includes("PAGE")), "other pages keep the top-right number");
  // cover, front matter, chapter 1, references and the appendix are each their own section
  assert.equal((document.match(/<w:sectPr/g) ?? []).length, 5);
  assert.equal((document.match(/<w:titlePg/g) ?? []).length, 4, "every section but the cover has its own first page");
  assert.equal((document.match(/<w:pgNumType[^>]*w:fmt="lowerRoman"/g) ?? []).length, 1);
  assert.equal((document.match(/<w:pgNumType[^>]*w:fmt="decimal"/g) ?? []).length, 3);
  assert.equal((document.match(/<w:pgNumType[^>]*w:start="1"/g) ?? []).length, 2, "numbers restart once for the body, not per chapter");
});

test("parseUnits reads alignment marks and list items", () => {
  assert.deepEqual(parseUnits("{right}Signed\nMusa\n\nPlain"), [
    { kind: "para", lines: ["Signed", "Musa"], align: "right" },
    { kind: "para", lines: ["Plain"], align: undefined },
  ]);
  assert.deepEqual(parseUnits("Steps:\n1. Wire it\n2) Test it\n- spare\n{center}(a) odd"), [
    { kind: "para", lines: ["Steps:"], align: undefined },
    { kind: "item", marker: "1.", text: "Wire it", align: undefined },
    { kind: "item", marker: "2)", text: "Test it", align: undefined },
    { kind: "item", marker: "•", text: "spare", align: undefined },
    { kind: "item", marker: "(a)", text: "odd", align: "center" },
  ]);
  // A year or a hyphenated word is not a list.
  assert.equal(parseUnits("2019. Then it rained.\nwell-known")[0].kind, "para");
});

test("a paragraph or list item can be aligned on its own in the Word file", async () => {
  const withMarks: ExportModel = { ...model, chapters: [{ ...model.chapters[0], sections: [{ ...model.chapters[0].sections[0], body: [{ t: "text", text: "Justified one.\n\n{left}Left one.\n\n{right}Right one.\n\n{center}Centre one.\n\n1. First step\n{right}2. Second step" }] }] }] };
  const zip = await JSZip.loadAsync(await buildDocx(withMarks));
  const xml = await zip.file("word/document.xml")!.async("string");
  const paragraph = (text: string) => (xml.match(/<w:p>.*?<\/w:p>/gs) ?? []).find((p) => p.includes(text))!;
  assert.match(paragraph("Justified one."), /w:jc w:val="both"/);
  assert.match(paragraph("Left one."), /w:jc w:val="left"/);
  assert.match(paragraph("Right one."), /w:jc w:val="right"/);
  assert.match(paragraph("Centre one."), /w:jc w:val="center"/);
  assert.match(paragraph("First step"), /w:hanging="567"/, "list items hang their marker");
  assert.match(paragraph("Second step"), /w:jc w:val="right"/);
  assert.doesNotMatch(xml, /\{right\}|\{left\}/, "the marks never reach the document");
});
