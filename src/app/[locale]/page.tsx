import { notFound } from "next/navigation";
import { getProductLandingData } from "@/features/offers/offer-service";
import { ProductLandingView } from "@/components/storefront/product-landing-view";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Find flagship product or first active product
  let landingData = await getProductLandingData("t-shirt-signature-rayana");

  if (!landingData) {
    try {
      const fallbackProducts = await db
        .select({ slug: products.slug })
        .from(products)
        .where(eq(products.status, "active"))
        .orderBy(desc(products.createdAt))
        .limit(1);

      if (fallbackProducts.length > 0) {
        landingData = await getProductLandingData(fallbackProducts[0].slug);
      }
    } catch {
      // Fallback if DB is not reachable during build or startup
    }
  }

  if (!landingData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="text-2xl font-bold">Catalogue en cours de préparation</h1>
        <p className="text-muted-foreground text-sm">
          Le catalogue RAYANA sera disponible dans quelques instants.
        </p>
      </div>
    );
  }

  return (
    <ProductLandingView
      product={landingData.product}
      offers={landingData.offers as any}
      reviews={landingData.reviews}
      locale={locale}
    />
  );
}
