import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/security/session";
import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ReviewsManager, ReviewItemData } from "./reviews-manager";

export default async function AdminReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  const allReviews = await db.select().from(reviews).orderBy(desc(reviews.createdAt));

  const formattedReviews: ReviewItemData[] = allReviews.map((r) => ({
    id: r.id,
    customerName: r.customerName,
    customerCity: r.customerCity,
    rating: r.rating,
    headline: r.headline,
    comment: r.comment,
    mediaUrls: r.mediaUrls,
    isVerifiedPurchase: r.isVerifiedPurchase,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground font-serif tracking-tight">
          File de Modération des Avis
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Validation des avis et photographies soumis par les clients vérifiés après livraison
        </p>
      </div>

      <ReviewsManager reviews={formattedReviews} locale={locale} />
    </div>
  );
}

