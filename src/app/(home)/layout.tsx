import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/seo/config";

export const metadata = buildPageMetadata({
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DEFAULT_DESCRIPTION,
  path: "/",
  keywords: [...SITE_KEYWORDS],
  noTitleTemplate: true,
});

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
