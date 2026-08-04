import type { MetadataRoute } from "next";
import { SITE_DEFAULT_DESCRIPTION, SITE_NAME, getSiteUrl } from "@/lib/seo/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Pure Himachali Products`,
    short_name: SITE_NAME,
    description: SITE_DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#2d6a4f",
    lang: "en-IN",
    orientation: "portrait-primary",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    id: getSiteUrl(),
  };
}
