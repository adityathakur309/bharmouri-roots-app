import fs from "fs";
import path from "path";
import sharp from "sharp";

async function makeIcon(size: number, file: string, label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="100%" height="100%" fill="#2d6a4f"/>
  <text x="50%" y="54%" fill="white" font-size="${Math.floor(size * 0.42)}" font-family="Arial,sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="middle">${label}</text>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file);
}

async function makeOg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#1b4332"/>
      <stop offset="1" stop-color="#40916c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <text x="72" y="220" fill="white" font-size="64" font-family="Arial" font-weight="700">BharmouriRoots</text>
  <text x="72" y="300" fill="white" font-size="34" font-family="Arial" opacity="0.95">Pure Himachali Organic &amp; Handcrafted Products</text>
  <text x="72" y="380" fill="white" font-size="24" font-family="Arial" opacity="0.85">Organic · Handcrafted · Mountain Sourced</text>
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile("public/og/default.png");
}

async function main() {
  fs.mkdirSync("public/icons", { recursive: true });
  fs.mkdirSync("public/og", { recursive: true });
  await makeIcon(192, "public/icons/icon-192.png", "B");
  await makeIcon(512, "public/icons/icon-512.png", "BR");
  await makeIcon(180, "public/apple-touch-icon.png", "BR");
  await makeOg();
  console.log("Generated icons in", path.resolve("public"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
