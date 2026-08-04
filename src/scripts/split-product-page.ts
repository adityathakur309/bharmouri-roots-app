import fs from "fs";

const src = "src/app/(shop)/products/[id]/page.tsx";
let s = fs.readFileSync(src, "utf8");
s = s.replace(
  'import { useParams, notFound } from "next/navigation";',
  'import { notFound } from "next/navigation";'
);
s = s.replace(
  `export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.id as string;`,
  `export function ProductDetailClient({ slug }: { slug: string }) {`
);
fs.mkdirSync("src/components/product", { recursive: true });
fs.writeFileSync("src/components/product/product-detail-client.tsx", s);
console.log("Wrote product-detail-client.tsx");
