import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Account",
  description: "Sign in to your BharmouriRoots account.",
  path: "/login",
  indexable: false,
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
