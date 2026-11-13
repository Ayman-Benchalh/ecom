import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db";
import { reviewInvitations, orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "orderId requis" }, { status: 400 });
    }

    const [order] = await db
      .select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ success: false, error: "Commande introuvable" }, { status: 404 });
    }

    // Generate random 32-byte cryptographic token
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    await db.insert(reviewInvitations).values({
      orderId: order.id,
      token,
      expiresAt,
    });

    const inviteUrl = `/fr/reviews/submit/${token}`;

    return NextResponse.json({
      success: true,
      token,
      inviteUrl,
    });
  } catch (err: any) {
    console.error("Generate review invitation error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
