/** Renders a reference where text between asterisks is italic. */
export function Formatted({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("*") && part.endsWith("*") && part.length > 2 ? <em key={index}>{part.slice(1, -1)}</em> : <span key={index}>{part}</span>,
      )}
    </>
  );
}
