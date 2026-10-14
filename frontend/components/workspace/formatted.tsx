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
