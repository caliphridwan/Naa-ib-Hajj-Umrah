/** Renders ﷺ in an Arabic font so it displays correctly on every device. */
export function Honorific({ text }: { text: string }) {
  const parts = text.split("ﷺ");
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <span className="saw text-[1.15em]" title="ṣallā Allāhu ʿalayhi wa sallam — peace and blessings be upon him">ﷺ</span>}
        </span>
      ))}
    </>
  );
}
