/** Temporary wordmark until the official logo is supplied (Settings → Logo URL). */
export function Logo({ name, logoUrl, light = false }: { name: string; logoUrl?: string | null; light?: boolean }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className="h-10 w-auto" />;
  }
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden>
        <path d="M20 2l5.3 12.7L38 20l-12.7 5.3L20 38l-5.3-12.7L2 20l12.7-5.3z" fill="none" stroke="#b8913a" strokeWidth="1.6" />
        <rect x="11" y="11" width="18" height="18" transform="rotate(45 20 20)" fill="none" stroke="#b8913a" strokeWidth="1.2" />
        <circle cx="20" cy="20" r="3" fill="#b8913a" />
      </svg>
      <span className={`font-serif text-xl font-semibold leading-none tracking-wide ${light ? "text-ivory" : "text-pine-900"}`}>
        {name}
      </span>
    </span>
  );
}
