import { parseUnits } from "@/lib/workspace/blocks";

/** Renders text where **bold**, *italic* and ++underline++ marks are shown as emphasis. */
export function Formatted({ text }: { text: string }) {
  const parts = text.split(/(\*\*\*[^*\n]+\*\*\*|\*\*[^*\n]+\*\*|\+\+[^+\n]+\+\+|\*[^*\n]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => {
        if (part.length > 6 && part.startsWith("***") && part.endsWith("***")) return <strong key={index}><em>{part.slice(3, -3)}</em></strong>;
        if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
        if (part.length > 4 && part.startsWith("++") && part.endsWith("++")) return <u key={index}>{part.slice(2, -2)}</u>;
        if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

/** The Preview tab: paragraphs and list items with the alignment the writer chose. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {parseUnits(text).map((unit, index) =>
        unit.kind === "para" ? (
          <p key={index} className="pf-unit" style={unit.align ? { textAlign: unit.align } : undefined}>
            {unit.lines.map((line, i) => (
              <span key={i}>{i > 0 && <br />}<Formatted text={line} /></span>
            ))}
          </p>
        ) : (
          <p key={index} className="pf-unit pf-unit-item" style={unit.align ? { textAlign: unit.align } : undefined}>
            <span className="pf-marker">{unit.marker}</span>
            <span><Formatted text={unit.text} /></span>
          </p>
        ),
      )}
    </>
  );
}
