import { z } from "zod";

/**
 * Moroccan Cities with localized names and shipping zones
 */
export interface MoroccanCity {
  id: string;
  nameFr: string;
  nameAr: string;
  nameEn: string;
  zone: "zone_1" | "zone_2" | "zone_3"; // zone_1: major hubs, zone_2: secondary cities, zone_3: remote
  defaultShippingFee: number; // in MAD
}

export const MOROCCAN_CITIES: MoroccanCity[] = [
  { id: "casablanca", nameFr: "Casablanca", nameAr: "الدار البيضاء", nameEn: "Casablanca", zone: "zone_1", defaultShippingFee: 25 },
  { id: "rabat", nameFr: "Rabat", nameAr: "الرباط", nameEn: "Rabat", zone: "zone_1", defaultShippingFee: 30 },
  { id: "marrakech", nameFr: "Marrakech", nameAr: "مراكش", nameEn: "Marrakech", zone: "zone_1", defaultShippingFee: 35 },
  { id: "tanger", nameFr: "Tanger", nameAr: "طنجة", nameEn: "Tangier", zone: "zone_1", defaultShippingFee: 35 },
  { id: "fes", nameFr: "Fès", nameAr: "فاس", nameEn: "Fez", zone: "zone_1", defaultShippingFee: 35 },
  { id: "agadir", nameFr: "Agadir", nameAr: "أكادير", nameEn: "Agadir", zone: "zone_1", defaultShippingFee: 35 },
  { id: "meknes", nameFr: "Meknès", nameAr: "مكناس", nameEn: "Meknes", zone: "zone_2", defaultShippingFee: 35 },
  { id: "oujda", nameFr: "Oujda", nameAr: "وجدة", nameEn: "Oujda", zone: "zone_2", defaultShippingFee: 40 },
  { id: "kenitra", nameFr: "Kénitra", nameAr: "القنيطرة", nameEn: "Kenitra", zone: "zone_1", defaultShippingFee: 30 },
  { id: "tetouan", nameFr: "Tétouan", nameAr: "تطوان", nameEn: "Tetouan", zone: "zone_2", defaultShippingFee: 35 },
  { id: "safi", nameFr: "Safi", nameAr: "آسفي", nameEn: "Safi", zone: "zone_2", defaultShippingFee: 35 },
  { id: "el-jadida", nameFr: "El Jadida", nameAr: "الجديدة", nameEn: "El Jadida", zone: "zone_2", defaultShippingFee: 35 },
  { id: "mohammedia", nameFr: "Mohammédia", nameAr: "المحمدية", nameEn: "Mohammedia", zone: "zone_1", defaultShippingFee: 25 },
  { id: "nador", nameFr: "Nador", nameAr: "الناظور", nameEn: "Nador", zone: "zone_2", defaultShippingFee: 40 },
  { id: "beni-mellal", nameFr: "Béni Mellal", nameAr: "بني ملال", nameEn: "Beni Mellal", zone: "zone_2", defaultShippingFee: 35 },
  { id: "khouribga", nameFr: "Khouribga", nameAr: "خريبكة", nameEn: "Khouribga", zone: "zone_2", defaultShippingFee: 35 },
  { id: "taza", nameFr: "Taza", nameAr: "تازة", nameEn: "Taza", zone: "zone_2", defaultShippingFee: 40 },
  { id: "settat", nameFr: "Settat", nameAr: "سطات", nameEn: "Settat", zone: "zone_2", defaultShippingFee: 35 },
  { id: "berrechid", nameFr: "Berrechid", nameAr: "برشيد", nameEn: "Berrechid", zone: "zone_1", defaultShippingFee: 30 },
  { id: "khemisset", nameFr: "Khémisset", nameAr: "الخميسات", nameEn: "Khemisset", zone: "zone_2", defaultShippingFee: 35 },
  { id: "temara", nameFr: "Témara", nameAr: "تمارة", nameEn: "Temara", zone: "zone_1", defaultShippingFee: 30 },
  { id: "laayoune", nameFr: "Laâyoune", nameAr: "العيون", nameEn: "Laayoune", zone: "zone_3", defaultShippingFee: 45 },
  { id: "dakhla", nameFr: "Dakhla", nameAr: "الداخلة", nameEn: "Dakhla", zone: "zone_3", defaultShippingFee: 50 },
  { id: "ouarzazate", nameFr: "Ouarzazate", nameAr: "ورزازات", nameEn: "Ouarzazate", zone: "zone_3", defaultShippingFee: 45 },
  { id: "taroudant", nameFr: "Taroudant", nameAr: "تارودانت", nameEn: "Taroudant", zone: "zone_2", defaultShippingFee: 40 },
  { id: "larache", nameFr: "Larache", nameAr: "العرائش", nameEn: "Larache", zone: "zone_2", defaultShippingFee: 35 },
  { id: "ksar-el-kebir", nameFr: "Ksar El Kébir", nameAr: "القصر الكبير", nameEn: "Ksar El Kebir", zone: "zone_2", defaultShippingFee: 35 },
  { id: "guelmim", nameFr: "Guelmim", nameAr: "كلميم", nameEn: "Guelmim", zone: "zone_3", defaultShippingFee: 45 },
  { id: "errachidia", nameFr: "Errachidia", nameAr: "الرشيدية", nameEn: "Errachidia", zone: "zone_3", defaultShippingFee: 45 },
  { id: "tiznit", nameFr: "Tiznit", nameAr: "تيزنيت", nameEn: "Tiznit", zone: "zone_2", defaultShippingFee: 40 },
  { id: "al-hoceima", nameFr: "Al Hoceïma", nameAr: "الحسيمة", nameEn: "Al Hoceima", zone: "zone_2", defaultShippingFee: 40 },
];

/**
 * Normalizes a Moroccan phone number to canonical format +2126XXXXXXXX or +2127XXXXXXXX
 * Accepts:
 * - 0612345678, 0712345678, 0512345678
 * - +212612345678, 212612345678, 00212612345678
 * - With or without spaces, dashes, dots: "06 12-34.56 78"
 */
export function normalizeMoroccanPhone(rawPhone: string): string | null {
  if (!rawPhone) return null;
  // Remove all non-digit characters except leading '+'
  let cleaned = rawPhone.trim().replace(/[\s\-\.\(\)]/g, "");

  // If starts with 00212, replace with +212
  if (cleaned.startsWith("00212")) {
    cleaned = "+212" + cleaned.slice(5);
  } else if (cleaned.startsWith("212")) {
    cleaned = "+" + cleaned;
  } else if (cleaned.startsWith("0")) {
    // e.g. 0612345678 -> +212612345678
    cleaned = "+212" + cleaned.slice(1);
  }

  // Moroccan mobile prefix check: +212 followed by 6, 7 or landline 5, and exactly 8 more digits
  // Total digits after +212: 9 digits (total length with +212 is 13)
  const moroccoPhoneRegex = /^\+212[567][0-9]{8}$/;
  if (moroccoPhoneRegex.test(cleaned)) {
    return cleaned;
  }

  return null;
}

/**
 * Format phone for customer display (e.g. 06 12 34 56 78)
 */
export function formatMoroccanPhoneDisplay(phone: string): string {
  const normalized = normalizeMoroccanPhone(phone);
  if (!normalized) return phone;
  // +212 6XX XX XX XX -> 06XX-XX-XX-XX or 06 12 34 56 78
  const local = "0" + normalized.slice(4);
  return `${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
}

/**
 * Zod validator for Moroccan phone numbers
 */
export const moroccanPhoneSchema = z
  .string()
  .min(8, { message: "Numéro de téléphone requis" })
  .refine(
    (val) => normalizeMoroccanPhone(val) !== null,
    {
      message: "Numéro de téléphone marocain invalide (ex: 06 12 34 56 78 ou 07 12 34 56 78)",
    }
  );

/**
 * Zod schema for Moroccan COD Checkout
 */
export const codCheckoutSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: "Veuillez entrer votre nom complet" })
    .max(100, { message: "Le nom ne doit pas dépasser 100 caractères" }),
  phone: moroccanPhoneSchema,
  city: z
    .string()
    .min(2, { message: "Veuillez sélectionner ou indiquer votre ville" }),
  address: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  offerId: z.string().uuid({ message: "Offre invalide" }),
  quantity: z.number().int().min(1).max(10).default(1),
  // Item selections: array of variant IDs selected for each slot/piece of the pack
  selectedVariants: z.array(
    z.object({
      slotNumber: z.number().int().min(1),
      variantId: z.string().uuid({ message: "Variante invalide" }),
    })
  ).min(1, { message: "Veuillez sélectionner les variantes de vos pièces" }),
  idempotencyKey: z.string().optional(),
});

export type CodCheckoutInput = z.infer<typeof codCheckoutSchema>;
