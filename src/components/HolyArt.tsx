/**
 * Illustrations of Masjid al-Haram (Kaaba) and Masjid an-Nabawi (Green Dome),
 * shown wherever the company has not yet uploaded a licensed photograph.
 */
export function HolyArt({ kind, className = "" }: { kind: "makkah" | "madinah"; className?: string }) {
  return kind === "makkah" ? <Makkah className={className} /> : <Madinah className={className} />;
}

function Sky({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#061f17" />
          <stop offset="0.65" stopColor="#0e3d2d" />
          <stop offset="1" stopColor="#1b6a52" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.62" r="0.5">
          <stop offset="0" stopColor="#dcc48d" stopOpacity="0.45" />
          <stop offset="1" stopColor="#dcc48d" stopOpacity="0" />
        </radialGradient>
        <pattern id={`${id}-stars`} width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M32 10l6.4 15.6L54 32l-15.6 6.4L32 54l-6.4-15.6L10 32l15.6-6.4z" fill="none" stroke="#b8913a" strokeOpacity=".14" />
        </pattern>
      </defs>
      <rect width="800" height="500" fill={`url(#${id}-sky)`} />
      <rect width="800" height="500" fill={`url(#${id}-stars)`} />
      <rect width="800" height="500" fill={`url(#${id}-glow)`} />
      {/* crescent */}
      <path d="M650 92a34 34 0 1 0 22 60 28 28 0 1 1-22-60z" fill="#dcc48d" opacity=".9" />
      {[[120, 70], [220, 120], [520, 60], [720, 180], [80, 190], [380, 40]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#f4ead2" opacity=".8" />
      ))}
    </>
  );
}

function Makkah({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Illustration of the Kaaba in Masjid al-Haram, Makkah">
      <Sky id="mk" />
      {/* clock tower silhouette */}
      <path d="M560 470V170h16v-40h8v-30l6-20 6 20v30h8v40h16v300z" fill="#061f17" opacity=".7" />
      <circle cx="590" cy="190" r="12" fill="#dcc48d" opacity=".55" />
      {/* minarets */}
      {[150, 250, 680].map((x) => (
        <g key={x} fill="#0a2e22">
          <rect x={x - 7} y="230" width="14" height="240" />
          <rect x={x - 10} y="300" width="20" height="6" fill="#b8913a" opacity=".5" />
          <path d={`M${x - 7} 230 L${x} 200 L${x + 7} 230z`} />
        </g>
      ))}
      {/* arcade of the mosque */}
      <rect x="0" y="380" width="800" height="120" fill="#0a2e22" />
      {Array.from({ length: 17 }, (_, i) => (
        <path key={i} d={`M${i * 48 + 4} 470v-55a20 20 0 0 1 40 0v55z`} fill="#dcc48d" opacity=".16" />
      ))}
      {/* mataf */}
      <ellipse cx="400" cy="470" rx="330" ry="46" fill="#f4ead2" opacity=".14" />
      {/* Kaaba */}
      <g>
        <path d="M330 300 L400 280 L470 300 L470 440 L400 462 L330 440z" fill="#08130f" />
        <path d="M400 280 L470 300 L470 440 L400 462z" fill="#000" opacity=".35" />
        {/* kiswah gold band */}
        <path d="M330 326 L400 306 L470 326 L470 340 L400 320 L330 340z" fill="#b8913a" />
        <path d="M330 326 L400 306 L400 320 L330 340z" fill="#dcc48d" />
        {/* door */}
        <path d="M352 372 L376 366 L376 420 L352 426z" fill="#b8913a" />
      </g>
    </svg>
  );
}

function Madinah({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Illustration of the Green Dome of Masjid an-Nabawi, Madinah">
      <Sky id="md" />
      {/* minarets */}
      {[150, 300, 520, 670].map((x, i) => (
        <g key={x} fill="#0a2e22">
          <rect x={x - 9} y={i % 2 ? 190 : 170} width="18" height="300" />
          <rect x={x - 13} y={i % 2 ? 260 : 240} width="26" height="7" fill="#b8913a" opacity=".55" />
          <rect x={x - 12} y={i % 2 ? 330 : 310} width="24" height="6" fill="#b8913a" opacity=".4" />
          <path d={`M${x - 9} ${i % 2 ? 190 : 170} q9 -36 18 0z`} />
          <rect x={x - 1} y={(i % 2 ? 190 : 170) - 44} width="2" height="16" fill="#dcc48d" />
        </g>
      ))}
      {/* mosque body */}
      <rect x="0" y="360" width="800" height="140" fill="#0a2e22" />
      {Array.from({ length: 20 }, (_, i) => (
        <path key={i} d={`M${i * 41 + 3} 480v-52a17 17 0 0 1 34 0v52z`} fill="#dcc48d" opacity=".15" />
      ))}
      {/* Green Dome */}
      <rect x="350" y="318" width="100" height="46" fill="#145240" />
      <path d="M350 320 Q350 236 400 222 Q450 236 450 320z" fill="#1f8a5b" />
      <path d="M400 222 Q450 236 450 320 L420 320 Q425 250 400 222z" fill="#000" opacity=".18" />
      <rect x="398" y="184" width="4" height="40" fill="#dcc48d" />
      <path d="M400 176a9 9 0 1 0 6 16 7 7 0 1 1-6-16z" fill="#dcc48d" />
      {/* courtyard umbrellas */}
      {[60, 210, 590, 740].map((x) => (
        <path key={x} d={`M${x - 46} 372 q46 -34 92 0z`} fill="#f4ead2" opacity=".22" />
      ))}
    </svg>
  );
}
