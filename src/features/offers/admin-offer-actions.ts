"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/security/session";
import { createOfferWithSlots } from "./offer-service";

export async function createPackOfferAction(input: {
  productId: string;
  title: string;
  fixedPrice: number;
  referencePrice?: number;
  itemCount: number;
  badge?: string;
  freeShipping?: boolean;
  isFeatured?: boolean;
}) {
  await requireAdmin();

  const slug = input.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const slots = [];
  for (let i = 1; i <= input.itemCount; i++) {
    slots.push({
      slotNumber: i,
      slotTitle: `Pièce n°${i} : Choix couleur & taille`,
      productId: input.productId,
      isRequired: true,
    });
  }

  const offer = await createOfferWithSlots({
    productId: input.productId,
    title: input.title,
    slug: `${slug}-${Date.now().toString().slice(-4)}`,
    fixedPrice: input.fixedPrice,
    referencePrice: input.referencePrice,
    itemCount: input.itemCount,
    badge: input.badge,
    offerType:
      input.itemCount === 1
        ? "single"
        : input.itemCount === 2
        ? "pack_duo"
        : input.itemCount === 3
        ? "pack_trio"
        : "custom_bundle",
    freeShipping: input.freeShipping !== false,
    isFeatured: input.isFeatured || false,
    slots,
  });

  revalidatePath("/[locale]/admin/packs");
  return { success: true, offer };
}
