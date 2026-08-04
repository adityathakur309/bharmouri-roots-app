import { JsonLd } from "@/components/seo/json-ld";
import {
  localBusinessJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld";

/** Global organization + website + local business graph (once per document). */
export function GlobalJsonLd() {
  return (
    <JsonLd
      data={[organizationJsonLd(), websiteJsonLd(), localBusinessJsonLd()]}
    />
  );
}
