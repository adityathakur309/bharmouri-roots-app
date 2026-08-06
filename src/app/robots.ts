import type { MetadataRoute } from "next";
import { CANONICAL_SITE_URL } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  const site = CANONICAL_SITE_URL;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/api/",
          "/login",
          "/signup",
          "/complete-registration",
          "/forgot-password",
          "/reset-password",
          "/cart",
          "/checkout",
          "/unauthorized",
          "/forbidden",
          "/profile",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: "bharmouriroots.com",
  };
}
