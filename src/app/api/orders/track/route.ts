import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, shipments, carriers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { normalizeMoroccanPhone } from "@/lib/validation/morocco";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderNumber, phone } = body;

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { success: false, error: "Identifiants de commande manquants." },
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

    // Secure verification: Must match BOTH orderNumber AND phone (using clean normalized phone check)
    const orderRows = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        customerCity: orders.customerCity,
        offerTitle: orders.offerTitle,
        quantity: orders.quantity,
        totalAmount: orders.totalAmount,
        status: orders.status,
        createdAt: orders.createdAt,
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
    const orderPhoneNormalized = normalizeMoroccanPhone(order.customerPhone);

    if (orderPhoneNormalized !== normalizedPhone) {
      // Don't leak details
      return NextResponse.json(
        { success: false, error: "Commande introuvable avec ce numéro de téléphone." },
        { status: 404 }
      );
    }

    // Fetch shipment & carrier if shipped
    let shipmentData = null;
    const shipmentRows = await db
      .select({
        trackingNumber: shipments.trackingNumber,
        status: shipments.status,
        carrierName: carriers.name,
        trackingUrlTemplate: carriers.trackingUrlTemplate,
      })
      .from(shipments)
      .leftJoin(carriers, eq(shipments.carrierId, carriers.id))
      .where(eq(shipments.orderId, order.id))
      .limit(1);

    if (shipmentRows.length > 0) {
      const s = shipmentRows[0];
      let trackingUrl = null;
      if (s.trackingUrlTemplate && s.trackingNumber) {
        trackingUrl = s.trackingUrlTemplate.replace("{tracking_number}", s.trackingNumber);
      }
      shipmentData = {
        trackingNumber: s.trackingNumber,
        carrierName: s.carrierName,
        trackingUrl,
      };
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        ...shipmentData,
      },
    });
  } catch (err: any) {
    console.error("Order track API error:", err);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la recherche." },
      { status: 500 }
    );
  }
}

