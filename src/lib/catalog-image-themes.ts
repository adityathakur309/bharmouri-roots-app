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
    from: "#1a4d3e",
    to: "#8b5a2b",
    accent: "#f0c48a",
    emoji: "🏔️",
    label: "Heart of the Himalayas",
  },
  shawls: {
    from: "#3d2a5c",
    to: "#7c5a2a",
    accent: "#e8d5b7",
    emoji: "🧣",
    label: "Himachali Heritage",
  },
  honey: {
    from: "#5c3d12",
    to: "#d97706",
    accent: "#fde68a",
    emoji: "🍯",
    label: "Raw Mountain Honey",
  },
  "story-banner": {
    from: "#14532d",
    to: "#6b4226",
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

/** Wide atmospheric hero / story banners (16:9) — texture only, no baked-in copy. */
export function buildHeroSvg(theme: CatalogImageTheme): string {
  const warm = theme.to;
  const cool = theme.from;
  const glow = theme.accent;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${cool}"/>
      <stop offset="45%" stop-color="${warm}"/>
      <stop offset="100%" stop-color="#3f2a1c"/>
    </linearGradient>
    <radialGradient id="sun" cx="72%" cy="28%" r="45%">
      <stop offset="0%" stop-color="#f6c48a" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="${glow}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>
  <rect width="1600" height="900" fill="url(#sky)"/>
  <rect width="1600" height="900" fill="url(#sun)"/>
  <g filter="url(#soft)" opacity="0.9">
    <ellipse cx="220" cy="680" rx="210" ry="140" fill="#6b4a32"/>
    <ellipse cx="480" cy="720" rx="190" ry="130" fill="#8a5c3a"/>
    <ellipse cx="760" cy="700" rx="230" ry="150" fill="#5c4030"/>
    <ellipse cx="1060" cy="740" rx="210" ry="140" fill="#9a6b42"/>
    <ellipse cx="1340" cy="690" rx="240" ry="160" fill="#7a5234"/>
    <ellipse cx="980" cy="560" rx="160" ry="110" fill="#c48a4a" opacity="0.55"/>
    <ellipse cx="360" cy="540" rx="140" ry="100" fill="#a87248" opacity="0.45"/>
  </g>
  <rect width="1600" height="900" fill="rgba(8,20,16,0.18)"/>
</svg>`;
}
