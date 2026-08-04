import type { Metadata } from "next";
import { NotFoundClient } from "./not-found-client";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Page not found",
  description: "The page you are looking for does not exist on BharmouriRoots.",
  path: "/404",
  indexable: false,
});

export default function NotFound() {
  return <NotFoundClient />;
}
