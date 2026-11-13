import { bootstrapAdminUser } from "../security/auth";
import { db } from "./index";
import {
  products,
  productCategories,
  productOptions,
  productOptionValues,
  productVariants,
  inventoryMovements,
  offers,
  offerSlots,
  landingPages,
  landingPageVersions,
  carriers,
  reviews,
} from "./schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("🌱 Starting RAYANA database seeding...");

  // 1. Admin user
  const admin = await bootstrapAdminUser();
  console.log("✓ Admin user verified/bootstrapped:", admin.email);

  // 2. Carriers
  const existingCarriers = await db.select().from(carriers).limit(1);
  let amanaCarrierId = "";
  if (existingCarriers.length === 0) {
    const [c1] = await db
      .insert(carriers)
      .values({
        name: "Amana Express (Poste Maroc)",
        trackingUrlTemplate: "https://www.amana-colis.ma/suivi?tracking={tracking_number}",
        phone: "0537202020",
        defaultShippingFee: "35.00",
        displayOrder: 1,
      })
      .returning();
    amanaCarrierId = c1.id;

    await db.insert(carriers).values([
      {
        name: "Cathedis Express",
        trackingUrlTemplate: "https://tracking.cathedis.net/{tracking_number}",
        phone: "0522001122",
        defaultShippingFee: "35.00",
        displayOrder: 2,
      },
      {
        name: "OzAleph Logistics (Casa/Rabat)",
        trackingUrlTemplate: "https://ozaleph.ma/track/{tracking_number}",
        phone: "0522334455",
        defaultShippingFee: "25.00",
        displayOrder: 3,
      },
    ]);
    console.log("✓ Moroccan carriers created");
  } else {
    amanaCarrierId = existingCarriers[0].id;
  }

  // 3. Category
  let categoryId = "";
  const existingCategories = await db.select().from(productCategories).limit(1);
  if (existingCategories.length === 0) {
    const [cat] = await db
      .insert(productCategories)
      .values({
        name: "Mode & Vêtements Homme",
        slug: "mode-homme",
        description: "Essentiels intemporels confectionnés pour le quotidien marocain",
      })
      .returning();
    categoryId = cat.id;
    console.log("✓ Product category created");
  } else {
    categoryId = existingCategories[0].id;
  }

  // 4. Flagship Product
  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.slug, "t-shirt-signature-rayana"))
    .limit(1);

  let productId = "";
  if (existingProduct.length === 0) {
    const [prod] = await db
      .insert(products)
      .values({
        name: "T-Shirt Coton Bio Signature RAYANA",
        slug: "t-shirt-signature-rayana",
        sku: "RY-TS-001",
        categoryId,
        shortDescription:
          "Le t-shirt essentiel marocain : coton peigné 240 GSM ultra-doux, coupe moderne ajustée, teintes intemporelles.",
        description:
          "Conçu spécifiquement pour le climat marocain, ce t-shirt en coton bio 100% peigné offre un confort exceptionnel et une tenue impeccable tout au long de la journée. Coutures renforcées, col indéformable et finitions haut de gamme.",
        purchasePrice: "45.00",
        sellingPrice: "99.00",
        referencePrice: "149.00",
        status: "active",
        badge: "Best-Seller Maroc",
        images: [
          {
            url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
            alt: "T-Shirt Coton Bio Signature Noir",
            isPrimary: true,
          },
          {
            url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
            alt: "T-Shirt Coton Bio Noir Porté",
          },
          {
            url: "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop&q=80",
            alt: "T-Shirt Coton Bio Beige Porté",
          },
        ],
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-black-clothes-40898-large.mp4",
        seoTitle: "T-Shirt Coton Bio Signature RAYANA | Livraison Gratuite Maroc",
        seoDescription:
          "Achetez le T-Shirt Coton Bio RAYANA. Livraison express partout au Maroc, paiement à la livraison (COD) et garantie satisfaction 7 jours.",
      })
      .returning();
    productId = prod.id;

    // Options: Color & Size
    const [optColor] = await db
      .insert(productOptions)
      .values({ productId, name: "Couleur", position: 0 })
      .returning();

    const [optSize] = await db
      .insert(productOptions)
      .values({ productId, name: "Taille", position: 1 })
      .returning();

    // Option Values
    const colors = [
      { value: "Noir", colorHex: "#111111" },
      { value: "Beige Sable", colorHex: "#D8C7B5" },
      { value: "Blanc Pur", colorHex: "#FFFFFF" },
      { value: "Vert Émeraude", colorHex: "#0F4C3A" },
    ];
    for (let i = 0; i < colors.length; i++) {
      await db.insert(productOptionValues).values({
        optionId: optColor.id,
        value: colors[i].value,
        colorHex: colors[i].colorHex,
        position: i,
      });
    }

    const sizes = ["S", "M", "L", "XL", "XXL"];
    for (let i = 0; i < sizes.length; i++) {
      await db.insert(productOptionValues).values({
        optionId: optSize.id,
        value: sizes[i],
        position: i,
      });
    }

    // Create realistic variants
    for (const color of colors) {
      for (const size of sizes) {
        const title = `${color.value} / ${size}`;
        const colorCode = color.value.slice(0, 3).toUpperCase();
        const sku = `RY-TS-${colorCode}-${size}`;
        const [variant] = await db
          .insert(productVariants)
          .values({
            productId,
            sku,
            title,
            stockQuantity: 30,
            status: "active",
          })
          .returning();

        await db.insert(inventoryMovements).values({
          variantId: variant.id,
          delta: 30,
          reason: "initial_stock",
          balanceAfter: 30,
          notes: "Initial seed stock",
        });
      }
    }
    console.log("✓ Flagship product and all variants created");
  } else {
    productId = existingProduct[0].id;
  }

  // 5. Offers (Packs)
  const existingOffers = await db
    .select()
    .from(offers)
    .where(eq(offers.productId, productId));

  if (existingOffers.length === 0) {
    // Single Offer
    const [singleOffer] = await db
      .insert(offers)
      .values({
        productId,
        title: "Offre Standard — 1 T-Shirt Signature",
        slug: "offre-standard-1-tshirt",
        description: "Découvrez la douceur et la coupe irréprochable du coton peigné RAYANA.",
        offerType: "single",
        fixedPrice: "99.00",
        referencePrice: "149.00",
        itemCount: 1,
        freeShipping: false,
        displayOrder: 1,
      })
      .returning();

    await db.insert(offerSlots).values({
      offerId: singleOffer.id,
      slotNumber: 1,
      slotTitle: "Choisissez votre T-Shirt (Couleur & Taille)",
      productId,
    });

    // Duo Pack (Best Value / Recommended)
    const [duoOffer] = await db
      .insert(offers)
      .values({
        productId,
        title: "Pack Duo — 2 T-Shirts au Choix (Économisez 30 MAD)",
        slug: "pack-duo-2-tshirts",
        description: "Le choix préféré de nos clients : composez votre duo parfait selon vos envies.",
        badge: "PLUS POPULAIRE • -30%",
        offerType: "pack_duo",
        fixedPrice: "169.00",
        referencePrice: "198.00",
        itemCount: 2,
        freeShipping: true,
        isFeatured: true,
        displayOrder: 2,
      })
      .returning();

    await db.insert(offerSlots).values([
      {
        offerId: duoOffer.id,
        slotNumber: 1,
        slotTitle: "1ère Pièce : Couleur & Taille",
        productId,
      },
      {
        offerId: duoOffer.id,
        slotNumber: 2,
        slotTitle: "2ème Pièce : Couleur & Taille",
        productId,
      },
    ]);

    // Trio Pack (Family / Maximum Value)
    const [trioOffer] = await db
      .insert(offers)
      .values({
        productId,
        title: "Pack Trio — 3 T-Shirts au Choix (Meilleur Tarif)",
        slug: "pack-trio-3-tshirts",
        description: "Idéal pour renouveler votre dressing complet à prix exceptionnel.",
        badge: "MEILLEUR PRIX UNITAIRE",
        offerType: "pack_trio",
        fixedPrice: "229.00",
        referencePrice: "297.00",
        itemCount: 3,
        freeShipping: true,
        displayOrder: 3,
      })
      .returning();

    await db.insert(offerSlots).values([
      {
        offerId: trioOffer.id,
        slotNumber: 1,
        slotTitle: "1ère Pièce : Couleur & Taille",
        productId,
      },
      {
        offerId: trioOffer.id,
        slotNumber: 2,
        slotTitle: "2ème Pièce : Couleur & Taille",
        productId,
      },
      {
        offerId: trioOffer.id,
        slotNumber: 3,
        slotTitle: "3ème Pièce : Couleur & Taille",
        productId,
      },
    ]);
    console.log("✓ Single, Duo, and Trio packs created");
  }

  // 6. Default Landing Page
  const existingLanding = await db
    .select()
    .from(landingPages)
    .where(eq(landingPages.slug, "t-shirt-signature"))
    .limit(1);

  if (existingLanding.length === 0) {
    const [page] = await db
      .insert(landingPages)
      .values({
        title: "T-Shirt Coton Bio Signature RAYANA",
        slug: "t-shirt-signature",
        productId,
        status: "published",
        publishedAt: new Date(),
        seoTitle: "T-Shirt Coton Bio Signature RAYANA — Offre Exclusive Maroc",
        seoDescription: "Commandez le pack de T-shirts RAYANA en Coton Bio. Paiement à la livraison partout au Maroc.",
      })
      .returning();

    await db.insert(landingPageVersions).values({
      landingPageId: page.id,
      versionNumber: 1,
      sectionsJson: [
        { type: "announcement", text: "⚡ Offre Spéciale Saison : Livraison Gratuite partout au Maroc dès 2 pièces commandées !" },
        { type: "hero", title: "L'Essentiel Ultime en Coton Bio Peigné", subtitle: "Conçu pour durer, ajusté pour flatter la silhouette." },
        { type: "benefits", items: ["100% Coton Peigné 240 GSM", "Coupe Moderne Confortable", "Col Double Couture Anti-Déformation", "Teintures Certifiées Écologiques"] },
        { type: "pack_selector" },
        { type: "checkout_form" },
        { type: "reviews" },
        { type: "guarantee" },
      ],
      appearanceJson: {
        primaryColor: "#0F4C3A",
        accentColor: "#B25E29",
        borderRadius: "rounded-xl",
      },
      publishedAt: new Date(),
    });
    console.log("✓ Default landing page created & published");
  }

  // 7. Authentic sample reviews
  const existingReviews = await db.select().from(reviews).limit(1);
  if (existingReviews.length === 0) {
    await db.insert(reviews).values([
      {
        productId,
        customerName: "Youssef Tazi",
        customerCity: "Casablanca",
        rating: 5,
        headline: "Qualité exceptionnelle et coupe parfaite !",
        comment:
          "Franchement agréablement surpris par l'épaisseur du coton. J'ai commandé le pack duo (Noir et Beige), la livraison à Casa s'est faite en 24h. Le tissu ne bouge pas au lavage à 30°. Je recommande vivement !",
        isVerifiedPurchase: true,
        status: "approved",
        approvedAt: new Date(),
      },
      {
        productId,
        customerName: "Amina El Mansouri",
        customerCity: "Rabat - Agdal",
        rating: 5,
        headline: "Très doux et élégant",
        comment:
          "Acheté pour mon mari, il ne porte plus que ça ! Le paiement à la livraison avec Amana s'est très bien déroulé, le livreur était très courtois. Super rapport qualité-prix pour le pack de 2.",
        isVerifiedPurchase: true,
        status: "approved",
        approvedAt: new Date(),
      },
      {
        productId,
        customerName: "Mehdi Benjelloun",
        customerCity: "Marrakech",
        rating: 5,
        headline: "Excellent coton pour l'été à Marrakech",
        comment:
          "Très respirant et les coutures sont bien soignées. C'est rare de trouver cette qualité à 169 DH les deux pièces. Service client très réactif sur WhatsApp.",
        isVerifiedPurchase: true,
        status: "approved",
        approvedAt: new Date(),
      },
    ]);
    console.log("✓ Verified customer reviews added");
  }

  console.log("🎉 RAYANA Database Seeding Completed Successfully!");
}
