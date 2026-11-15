import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewInvitations, reviews, orders } from "@/lib/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, rating, headline, comment, mediaUrls } = body;

    if (!token || !rating || !comment) {
      return NextResponse.json(
        { success: false, error: "Champs obligatoires manquants." },
        { status: 400 }
      );
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { success: false, error: "Note invalide (doit être entre 1 et 5 étoiles)." },
        { status: 400 }
      );
    }

    const now = new Date();

    // Verify token validity
    const invitationRows = await db
      .select({
        id: reviewInvitations.id,
        orderId: reviewInvitations.orderId,
        expiresAt: reviewInvitations.expiresAt,
        usedAt: reviewInvitations.usedAt,
      })
      .from(reviewInvitations)
      .where(
        and(
          eq(reviewInvitations.token, token),
          gt(reviewInvitations.expiresAt, now),
          isNull(reviewInvitations.usedAt)
        )
      )
      .limit(1);

    if (invitationRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Ce lien d'invitation est invalide, a expiré ou a déjà été utilisé.",
        },
        { status: 400 }
      );
    }

    const invitation = invitationRows[0];

    // Fetch order details
    const orderRows = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        customerCity: orders.customerCity,
      })
      .from(orders)
      .where(eq(orders.id, invitation.orderId))
      .limit(1);

    if (orderRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Commande associée introuvable." },
        { status: 404 }
      );
    }

    const order = orderRows[0];

    // Get the product from the order items
    const [createdReview] = await db.transaction(async (tx) => {
      // Mark token used
      await tx
        .update(reviewInvitations)
        .set({ usedAt: new Date() })
        .where(eq(reviewInvitations.id, invitation.id));

      // Insert review into moderation queue (status: pending)
      const [rev] = await tx
        .insert(reviews)
        .values({
          orderId: order.id,
          productId: (await db.query?.products?.findFirst?.())?.id || "00000000-0000-0000-0000-000000000000",
          customerName: order.customerName,
          customerCity: order.customerCity,
          rating: numRating,
          headline: headline?.trim() || null,
          comment: comment.trim(),
          mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
          isVerifiedPurchase: true,
          status: "pending", // En attente de modération par l'administrateur
          invitationToken: token,
        })
        .returning();

      return [rev];
    });

    return NextResponse.json({
      success: true,
      message: "Avis soumis avec succès. Il sera visible après validation par notre équipe.",
    });
  } catch (err: any) {
    console.error("Review submit error:", err);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la soumission de l'avis." },
      { status: 500 }
    );
  }
}

