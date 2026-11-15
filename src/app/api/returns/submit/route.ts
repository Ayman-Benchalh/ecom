import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, returns, returnItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { normalizeMoroccanPhone } from "@/lib/validation/morocco";

function generateReturnNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(100 + Math.random() * 900);
  return `RET-${year}${month}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, phone, reason, description, evidenceMediaUrls } = body;

    if (!orderNumber || !phone || !reason || !description) {
      return NextResponse.json(
        { success: false, error: "Tous les champs obligatoires doivent être renseignés." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeMoroccanPhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { success: false, error: "Numéro de téléphone marocain invalide." },
        { status: 400 }
      );
    }

    // Verify order exists and matches phone
    const orderRows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerPhone: orders.customerPhone,
        status: orders.status,
      })
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber.trim().toUpperCase()))
      .limit(1);

    if (orderRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Commande introuvable." },
        { status: 404 }
      );
    }

    const order = orderRows[0];
    const orderPhoneNorm = normalizeMoroccanPhone(order.customerPhone);

    if (orderPhoneNorm !== normalizedPhone) {
      return NextResponse.json(
        { success: false, error: "Le numéro de téléphone ne correspond pas à cette commande." },
        { status: 400 }
      );
    }

    const returnNumber = generateReturnNumber();

    const [createdReturn] = await db
      .insert(returns)
      .values({
        returnNumber,
        orderId: order.id,
        customerPhone: order.customerPhone,
        reason,
        description: description.trim(),
        evidenceMediaUrls: Array.isArray(evidenceMediaUrls) ? evidenceMediaUrls : [],
        status: "requested",
        refundStatus: "not_applicable",
      })
      .returning();

    return NextResponse.json({
      success: true,
      returnNumber: createdReturn.returnNumber,
      message: "Demande de retour ou d'échange enregistrée avec succès.",
    });
  } catch (err: any) {
    console.error("Return submit API error:", err);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la demande de retour." },
      { status: 500 }
    );
  }
}

