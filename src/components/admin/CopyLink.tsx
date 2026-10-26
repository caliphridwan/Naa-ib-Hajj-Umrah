"use client";

import { useState } from "react";

export function CopyLink({ url, whatsappText }: { url: string; whatsappText: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2">
      <input readOnly value={url} className="input font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        <a className="btn-outline btn-sm" target="_blank" rel="noopener" href={`https://wa.me/?text=${encodeURIComponent(`${whatsappText}\n${url}`)}`}>
          Share on WhatsApp
        </a>
      </div>
    </div>
  );
}
