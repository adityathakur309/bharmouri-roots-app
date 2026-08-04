import { ImageResponse } from "next/og";
import { connectDB } from "@/lib/db/connect";
import { productService } from "@/modules/product/product.service";
import { SITE_NAME } from "@/lib/seo/config";

export const runtime = "nodejs";
export const alt = "Product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

export default async function ProductOgImage({ params }: Props) {
  const { id } = await params;
  let name = "Product";
  let price = "";
  let category = "";

  try {
    await connectDB();
    const product = await productService.getByIdOrSlug(id);
    name = String(product.name);
    price = `₹${Number(product.price).toLocaleString("en-IN")}`;
    category = String(product.category);
  } catch {
    /* fallback OG */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 60%, #52b788 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.9 }}>{SITE_NAME}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 24, opacity: 0.85 }}>{category}</div>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>
            {name}
          </div>
          {price ? (
            <div style={{ fontSize: 40, fontWeight: 600, marginTop: 8 }}>{price}</div>
          ) : null}
        </div>
        <div style={{ fontSize: 22, opacity: 0.85 }}>Authentic Himachali · Organic · Handcrafted</div>
      </div>
    ),
    { ...size }
  );
}
