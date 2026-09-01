/** Visual themes for locally generated catalog SVG assets. */

export interface CatalogImageTheme {
  from: string;
  to: string;
  accent: string;
  emoji: string;
  label: string;
}

const CATEGORY_THEMES: Record<string, CatalogImageTheme> = {
  honey: {
    from: "#fbbf24",
    to: "#b45309",
    accent: "#fef3c7",
    emoji: "🍯",
    label: "Honey",
  },
  pulses: {
    from: "#84cc16",
    to: "#3f6212",
    accent: "#ecfccb",
    emoji: "🫘",
    label: "Pulses",
  },
  "rice-grains": {
    from: "#eab308",
    to: "#a16207",
    accent: "#fef9c3",
    emoji: "🌾",
    label: "Rice & Grains",
  },
  spices: {
    from: "#ef4444",
    to: "#991b1b",
    accent: "#fee2e2",
    emoji: "🌶️",
    label: "Spices",
  },
  wellness: {
    from: "#8b5cf6",
    to: "#5b21b6",
    accent: "#ede9fe",
    emoji: "🪨",
    label: "Wellness",
  },
  handicrafts: {
    from: "#0ea5e9",
    to: "#0369a1",
    accent: "#e0f2fe",
    emoji: "🧢",
    label: "Handicrafts",
  },
  default: {
    from: "#059669",
    to: "#065f46",
    accent: "#d1fae5",
    emoji: "🌿",
    label: "Pahadi",
  },
};

const HERO_THEMES: Record<string, CatalogImageTheme> = {
  mountains: {
    from: "#0f766e",
    to: "#134e4a",
    accent: "#99f6e4",
    emoji: "🏔️",
    label: "Heart of the Himalayas",
  },
  shawls: {
    from: "#7c3aed",
    to: "#4c1d95",
    accent: "#ddd6fe",
    emoji: "🧣",
    label: "Himachali Heritage",
  },
  honey: {
    from: "#d97706",
    to: "#78350f",
    accent: "#fde68a",
    emoji: "🍯",
    label: "Raw Mountain Honey",
  },
  "story-banner": {
    from: "#14532d",
    to: "#052e16",
    accent: "#bbf7d0",
    emoji: "⛰️",
    label: "Rooted in the Himalayas",
  },
};

export function heroTheme(seed: string): CatalogImageTheme {
  return HERO_THEMES[seed] ?? {
    from: "#0f766e",
    to: "#115e59",
    accent: "#ccfbf1",
    emoji: "🏔️",
    label: seed
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
      .slice(0, 32),
  };
}

const PRODUCT_THEME_HINTS: Array<{ match: RegExp; category: string }> = [
  { match: /honey|multiflora|forest/, category: "honey" },
  { match: /rajma|kulath|mattar|dal/, category: "pulses" },
  { match: /rice/, category: "rice-grains" },
  { match: /chilli|lakhori|spice/, category: "spices" },
  { match: /shilajit/, category: "wellness" },
  { match: /topi|pahari/, category: "handicrafts" },
];

export function categoryTheme(slug: string): CatalogImageTheme {
  return CATEGORY_THEMES[slug] ?? CATEGORY_THEMES.default;
}

export function productTheme(seed: string): CatalogImageTheme {
  const hint = PRODUCT_THEME_HINTS.find((h) => h.match.test(seed));
  const base = categoryTheme(hint?.category ?? "default");
  const title = seed
    .replace(/-\d+$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return { ...base, label: title.slice(0, 28) };
}

export function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildCatalogSvg(
  theme: CatalogImageTheme,
  opts?: { subtitle?: string; variant?: "product" | "category" }
): string {
  const subtitle = opts?.subtitle ?? "BharmouriRoots · Himachal";
  const variant = opts?.variant ?? "product";
  const titleSize = variant === "category" ? 28 : 22;
  const emojiSize = variant === "category" ? 88 : 72;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.from}"/>
      <stop offset="100%" stop-color="${theme.to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="60%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <rect width="600" height="600" fill="url(#glow)"/>
  <circle cx="520" cy="80" r="120" fill="${theme.accent}" opacity="0.12"/>
  <circle cx="90" cy="520" r="90" fill="${theme.accent}" opacity="0.1"/>
  <text x="300" y="230" text-anchor="middle" font-size="${emojiSize}">${theme.emoji}</text>
  <text x="300" y="310" text-anchor="middle" fill="#ffffff" font-family="Georgia, 'Times New Roman', serif" font-size="${titleSize}" font-weight="700">${escapeSvgText(theme.label)}</text>
  <text x="300" y="350" text-anchor="middle" fill="#ffffff" opacity="0.88" font-family="system-ui, sans-serif" font-size="16">${escapeSvgText(subtitle)}</text>
  <rect x="40" y="500" width="520" height="56" rx="28" fill="rgba(255,255,255,0.14)"/>
  <text x="300" y="536" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="14" letter-spacing="2">AUTHENTIC · HIMALAYAN</text>
</svg>`;
}

/** Wide banner SVG for hero / story sections (16:9). */
export function buildHeroSvg(
  theme: CatalogImageTheme,
  opts?: { subtitle?: string }
): string {
  const subtitle = opts?.subtitle ?? "BharmouriRoots · Authentic Himachal";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="hbg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.from}"/>
      <stop offset="55%" stop-color="${theme.to}"/>
      <stop offset="100%" stop-color="#0b1220"/>
    </linearGradient>
    <linearGradient id="haze" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#hbg)"/>
  <rect width="1600" height="900" fill="url(#haze)"/>
  <path d="M0 620 L220 480 L380 560 L560 400 L760 540 L980 360 L1200 520 L1400 420 L1600 560 L1600 900 L0 900 Z" fill="rgba(0,0,0,0.22)"/>
  <path d="M0 700 L180 560 L340 640 L520 500 L720 620 L940 460 L1160 600 L1380 520 L1600 640 L1600 900 L0 900 Z" fill="rgba(0,0,0,0.18)"/>
  <circle cx="1280" cy="180" r="90" fill="${theme.accent}" opacity="0.35"/>
  <text x="120" y="340" font-size="96">${theme.emoji}</text>
  <text x="120" y="430" fill="#ffffff" font-family="Georgia, 'Times New Roman', serif" font-size="54" font-weight="700">${escapeSvgText(theme.label)}</text>
  <text x="120" y="480" fill="#ffffff" opacity="0.88" font-family="system-ui, sans-serif" font-size="26">${escapeSvgText(subtitle)}</text>
</svg>`;
}
