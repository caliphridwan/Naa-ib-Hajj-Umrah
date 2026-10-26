import { getSitePhotos, PHOTO_SLOTS, type SlotName } from "@/lib/site-photos";
import { HolyArt } from "./HolyArt";

/**
 * A site photo slot. Shows the uploaded photograph (with credit, when the
 * licence requires one) or, until one is uploaded, an illustration.
 */
export async function HolyImage({
  slot,
  className = "",
  imgClassName = "",
  priority = false,
  showCredit = true,
}: {
  slot: SlotName;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  showCredit?: boolean;
}) {
  const photos = await getSitePhotos();
  const photo = photos[slot];
  const art = PHOTO_SLOTS.find((s) => s.slot === slot)!.art;
  // Callers may position the figure themselves (e.g. as an absolute background).
  const position = /\b(absolute|fixed)\b/.test(className) ? "" : "relative";
  return (
    <figure className={`${position} overflow-hidden ${className}`}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.url}
          alt={photo.alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          className={`h-full w-full object-cover ${imgClassName}`}
        />
      ) : (
        <HolyArt kind={art} className={`h-full w-full ${imgClassName}`} />
      )}
      {showCredit && photo?.credit && (
        <figcaption className="absolute bottom-1.5 right-2 z-10 max-w-[80%] truncate rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-white/80">
          {photo.creditUrl ? (
            <a href={photo.creditUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{photo.credit}</a>
          ) : (
            photo.credit
          )}
        </figcaption>
      )}
    </figure>
  );
}

export async function hasSitePhoto(slot: SlotName) {
  return !!(await getSitePhotos())[slot];
}
