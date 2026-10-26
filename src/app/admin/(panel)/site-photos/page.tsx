import { requireAdmin } from "@/lib/auth";
import { getSitePhotos, PHOTO_SLOTS } from "@/lib/site-photos";
import { removeSitePhoto, saveSitePhoto } from "@/lib/admin/photo-actions";
import { Flash, PageHeader } from "@/components/admin/ui";
import { HolyImage } from "@/components/HolyImage";

export default async function SitePhotos({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin("ADMIN");
  const photos = await getSitePhotos();
  return (
    <>
      <PageHeader title="Site photos" subtitle="Photographs of Makkah and Madinah shown across the public website." />
      <Flash {...await searchParams} />
      <div className="mb-6 rounded-xl border border-gold-500/30 bg-gold-100/50 p-4 text-sm leading-relaxed">
        <p className="font-semibold text-pine-900">Only upload photos the company has the right to use.</p>
        <p className="mt-1">
          Good sources: your own photos from past trips, photos you have purchased (e.g. a stock photo licence), or free
          licences such as <strong>Unsplash</strong> (free for business use) and <strong>Wikimedia Commons</strong> (check
          each photo&apos;s licence — most require the photographer&apos;s name to be shown; enter it in “Credit” and it will
          appear on the photo automatically). Until a photo is uploaded, an illustration is shown.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {PHOTO_SLOTS.map((s) => {
          const p = photos[s.slot];
          return (
            <section key={s.slot} id={s.slot} className="card scroll-mt-6 overflow-hidden">
              <HolyImage slot={s.slot} className="aspect-[16/9] bg-pine-950" />
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-serif text-xl font-semibold text-pine-900">{s.label}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${p ? "bg-pine-50 text-pine-800" : "bg-sand text-stone"}`}>{p ? "Photo" : "Illustration"}</span>
                </div>
                {s.hint && <p className="mt-1 text-xs text-stone">{s.hint}</p>}
                <form action={saveSitePhoto.bind(null, s.slot)} className="mt-4 space-y-2">
                  <input type="file" name="file" accept="image/jpeg,image/png,image/webp" className="block text-sm" />
                  <input name="alt" className="input" placeholder="Describe the photo, e.g. The Kaaba at night" defaultValue={p?.alt ?? ""} required />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input name="credit" className="input" placeholder="Credit (if required), e.g. Photo: A. Name / CC BY-SA 4.0" defaultValue={p?.credit ?? ""} />
                    <input name="creditUrl" className="input" placeholder="Credit link (optional, https://…)" defaultValue={p?.creditUrl ?? ""} />
                  </div>
                  <label className="flex items-start gap-2 text-xs">
                    <input type="checkbox" name="rights" className="mt-0.5 accent-pine-700" required />
                    The company owns this photo or has a licence that allows its use on this website.
                  </label>
                  <div className="flex gap-2">
                    <button className="btn-primary btn-sm">{p ? "Save changes" : "Upload photo"}</button>
                  </div>
                </form>
                {p && (
                  <form action={removeSitePhoto.bind(null, s.slot)} className="mt-2">
                    <button className="text-xs text-red-700 hover:underline">Remove photo</button>
                  </form>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
