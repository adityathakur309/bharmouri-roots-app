import fs from "fs";
import path from "path";
import sharp from "sharp";

/**
 * Regenerates favicons / PWA icons / default OG from the brand source image.
 * Prefer: public/brand-favicon.png  (or public/favicon (2).png)
 */
async function resolveSource(): Promise<string> {
  const candidates = [
    "public/brand-favicon.png",
    "public/favicon (2).png",
    "public/favicon.png",
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) return file;
  }
  throw new Error(
    "No brand favicon source found. Add public/brand-favicon.png and re-run."
  );
}

async function resizePng(src: string, size: number, out: string) {
  await sharp(src)
    .ensureAlpha()
    .resize(size, size, { fit: "cover" })
    .png()
    .toFile(out);
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
  const src = await resolveSource();
  fs.mkdirSync("public/icons", { recursive: true });
  fs.mkdirSync("public/og", { recursive: true });
  fs.mkdirSync("src/app", { recursive: true });

  if (src !== "public/brand-favicon.png") {
    await sharp(src).ensureAlpha().png().toFile("public/brand-favicon.png");
  }

  await resizePng(src, 16, "public/favicon-16.png");
  await resizePng(src, 32, "public/favicon-32.png");
  await resizePng(src, 48, "public/favicon-48.png");
  await resizePng(src, 32, "src/app/icon.png");
  await resizePng(src, 180, "src/app/apple-icon.png");
  await resizePng(src, 180, "public/apple-touch-icon.png");
  await resizePng(src, 192, "public/icons/icon-192.png");
  await resizePng(src, 512, "public/icons/icon-512.png");
  await resizePng(src, 48, "public/favicon.png");

  try {
    const { default: pngToIco } = await import("png-to-ico");
    const ico = await pngToIco([
      "public/favicon-16.png",
      "public/favicon-32.png",
      "public/favicon-48.png",
    ]);
    fs.writeFileSync("public/favicon.ico", ico);
    fs.writeFileSync("src/app/favicon.ico", ico);
  } catch {
    console.warn(
      "png-to-ico unavailable — PNG favicons still generated. Run: npm i -D png-to-ico"
    );
  }

  await makeOg();
  console.log("Generated SEO assets from", path.resolve(src));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
