import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ==========================================
// 1. ADMIN USERS & SESSIONS
// ==========================================
export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 100 }).notNull().default("Administrator"),
    role: varchar("role", { length: 50 }).notNull().default("super_admin"),
    totpSecret: text("totp_secret"),
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_users_email_idx").on(table.email),
  ]
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_sessions_token_idx").on(table.token),
    index("admin_sessions_user_id_idx").on(table.adminUserId),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: varchar("entity_id", { length: 255 }),
    detailsJson: jsonb("details_json").default({}),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

// ==========================================
// 2. PRODUCTS, OPTIONS & VARIANTS
// ==========================================
export const productCategories = pgTable(
  "product_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull().unique(),
    description: text("description"),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_categories_slug_idx").on(table.slug),
  ]
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    description: text("description"),
    shortDescription: text("short_description"),
    categoryId: uuid("category_id").references(() => productCategories.id, { onDelete: "set null" }),
    purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
    sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
    referencePrice: numeric("reference_price", { precision: 10, scale: 2 }), // Cross-out original price
    status: varchar("status", { length: 30 }).notNull().default("active"), // draft, active, archived
    images: jsonb("images").notNull().default(sql`'[]'::jsonb`), // array of { url, alt, isPrimary }
    videoUrl: text("video_url"),
    badge: varchar("badge", { length: 80 }), // e.g. "Best Seller", "Nouveau"
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    uniqueIndex("products_sku_idx").on(table.sku),
    index("products_status_idx").on(table.status),
  ]
);

export const productOptions = pgTable(
  "product_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(), // e.g. "Couleur", "Taille"
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("product_options_product_id_idx").on(table.productId),
  ]
);

export const productOptionValues = pgTable(
  "product_option_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    optionId: uuid("option_id")
      .notNull()
      .references(() => productOptions.id, { onDelete: "cascade" }),
    value: varchar("value", { length: 100 }).notNull(), // e.g. "Noir", "M", "XL"
    colorHex: varchar("color_hex", { length: 20 }), // e.g. "#000000" for color swatch
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("product_option_values_option_id_idx").on(table.optionId),
  ]
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 100 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(), // e.g. "Noir / M"
    priceOverride: numeric("price_override", { precision: 10, scale: 2 }), // optional override
    stockQuantity: integer("stock_quantity").notNull().default(0),
    imageUrl: text("image_url"),
    status: varchar("status", { length: 30 }).notNull().default("active"), // active, inactive
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_variants_sku_idx").on(table.sku),
    index("product_variants_product_id_idx").on(table.productId),
  ]
);

export const productVariantValues = pgTable(
  "product_variant_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    optionValueId: uuid("option_value_id")
      .notNull()
      .references(() => productOptionValues.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("variant_values_variant_id_idx").on(table.variantId),
    index("variant_values_option_value_id_idx").on(table.optionValueId),
  ]
);

// Inventory movements ledger for stock auditing & race-condition prevention
export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(), // e.g. -1 for order, +10 for restock
    reason: varchar("reason", { length: 50 }).notNull(), // order_placed, order_cancelled, manual_adjustment, restock, return
    referenceId: varchar("reference_id", { length: 255 }), // orderId or movement reference
    balanceAfter: integer("balance_after").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("inventory_movements_variant_id_idx").on(table.variantId),
    index("inventory_movements_created_at_idx").on(table.createdAt),
  ]
);

// ==========================================
// 3. ADVANCED PACK & BUNDLE ENGINE
// ==========================================
export const offers = pgTable(
  "offers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(), // e.g. "Pack Duo - 2 T-shirts", "Offre Découverte"
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    badge: varchar("badge", { length: 100 }), // e.g. "Plus Populaire", "Économisez 30%"
    offerType: varchar("offer_type", { length: 50 }).notNull().default("pack"), // single, pack_duo, pack_trio, custom_bundle
    fixedPrice: numeric("fixed_price", { precision: 10, scale: 2 }).notNull(), // The complete pack price (e.g. 169.00 MAD)
    referencePrice: numeric("reference_price", { precision: 10, scale: 2 }), // Strikethrough price (e.g. 240.00 MAD)
    itemCount: integer("item_count").notNull().default(1), // Total pieces customer customizes
    freeShipping: boolean("free_shipping").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("offers_slug_idx").on(table.slug),
    index("offers_product_id_idx").on(table.productId),
    index("offers_active_idx").on(table.isActive),
  ]
);

// Individual customizable slots in a pack (e.g. Piece 1, Piece 2, Piece 3)
export const offerSlots = pgTable(
  "offer_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    slotNumber: integer("slot_number").notNull(), // 1, 2, 3...
    slotTitle: varchar("slot_title", { length: 255 }).notNull(), // e.g. "1ère Pièce : Choisissez la couleur & taille"
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    isRequired: boolean("is_required").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("offer_slots_offer_id_idx").on(table.offerId),
  ]
);

// ==========================================
// 4. LANDING PAGE BUILDER & VERSIONS
// ==========================================
export const landingPages = pgTable(
  "landing_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    status: varchar("status", { length: 30 }).notNull().default("draft"), // draft, published, archived
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: text("seo_description"),
    metaPixelId: varchar("meta_pixel_id", { length: 100 }),
    activeVersionNumber: integer("active_version_number").notNull().default(1),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("landing_pages_slug_idx").on(table.slug),
    index("landing_pages_status_idx").on(table.status),
  ]
);

export const landingPageVersions = pgTable(
  "landing_page_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    landingPageId: uuid("landing_page_id")
      .notNull()
      .references(() => landingPages.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    sectionsJson: jsonb("sections_json").notNull().default(sql`'[]'::jsonb`),
    appearanceJson: jsonb("appearance_json").notNull().default(sql`'{}'::jsonb`),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("landing_page_versions_page_idx").on(table.landingPageId, table.versionNumber),
  ]
);

// ==========================================
// 5. CUSTOMERS, ORDERS & FULFILLMENT
// ==========================================
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    phoneNormalized: varchar("phone_normalized", { length: 50 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    address: text("address"),
    notes: text("notes"),
    orderCount: integer("order_count").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("customers_phone_normalized_idx").on(table.phoneNormalized),
    index("customers_city_idx").on(table.city),
  ]
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: varchar("order_number", { length: 50 }).notNull().unique(), // e.g. "RY-2611-0001"
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    customerName: varchar("customer_name", { length: 150 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
    customerCity: varchar("customer_city", { length: 100 }).notNull(),
    customerAddress: text("customer_address"),
    customerNotes: text("customer_notes"),

    offerId: uuid("offer_id").references(() => offers.id, { onDelete: "set null" }),
    offerTitle: varchar("offer_title", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull().default(1),

    subtotalAmount: numeric("subtotal_amount", { precision: 10, scale: 2 }).notNull(),
    shippingFee: numeric("shipping_fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
    discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(), // Subtotal + shipping - discount
    currency: varchar("currency", { length: 10 }).notNull().default("MAD"),

    // Order operational lifecycle:
    // NEW -> CONTACTED -> CONFIRMED -> READY -> SHIPPED -> DELIVERED (or DELIVERY_FAILED, RETURNED, CANCELLED)
    status: varchar("status", { length: 50 }).notNull().default("NEW"),

    // Financial lifecycle: UNPAID -> COLLECTED_BY_CARRIER -> SETTLED -> REFUNDED
    financialStatus: varchar("financial_status", { length: 50 }).notNull().default("UNPAID"),

    confirmationAttempts: integer("confirmation_attempts").notNull().default(0),
    internalNotes: text("internal_notes"),

    // Attribution & telemetry
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    utmSource: varchar("utm_source", { length: 100 }),
    utmMedium: varchar("utm_medium", { length: 100 }),
    utmCampaign: varchar("utm_campaign", { length: 100 }),
    idempotencyKey: varchar("idempotency_key", { length: 100 }),

    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("orders_order_number_idx").on(table.orderNumber),
    index("orders_status_idx").on(table.status),
    index("orders_financial_status_idx").on(table.financialStatus),
    index("orders_customer_phone_idx").on(table.customerPhone),
    index("orders_created_at_idx").on(table.createdAt),
    index("orders_idempotency_idx").on(table.idempotencyKey),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "restrict" }),
    packSlotNumber: integer("pack_slot_number").notNull().default(1), // Slot 1, Slot 2...
    productTitle: varchar("product_title", { length: 255 }).notNull(),
    variantTitle: varchar("variant_title", { length: 255 }).notNull(), // e.g. "Noir / M"
    sku: varchar("sku", { length: 100 }).notNull(),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
    snapshotJson: jsonb("snapshot_json").default({}), // Immutable snapshot of variant details at purchase time
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_variant_id_idx").on(table.variantId),
  ]
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    actorType: varchar("actor_type", { length: 50 }).notNull().default("system"), // system, admin, customer
    actorId: varchar("actor_id", { length: 255 }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    oldStatus: varchar("old_status", { length: 50 }),
    newStatus: varchar("new_status", { length: 50 }),
    notes: text("notes"),
    metadataJson: jsonb("metadata_json").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("order_events_order_id_idx").on(table.orderId),
    index("order_events_created_at_idx").on(table.createdAt),
  ]
);

// ==========================================
// 6. CARRIERS, SHIPMENTS & COD RECONCILIATION
// ==========================================
export const carriers = pgTable(
  "carriers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(), // e.g. "Amana Express", "Cathedis", "OzAleph", "Ghazala"
    trackingUrlTemplate: text("tracking_url_template"), // e.g. "https://carrier.ma/track/{tracking_number}"
    phone: varchar("phone", { length: 50 }),
    email: varchar("email", { length: 100 }),
    defaultShippingFee: numeric("default_shipping_fee", { precision: 10, scale: 2 }).notNull().default("35.00"),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const shipments = pgTable(
  "shipments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    carrierId: uuid("carrier_id").references(() => carriers.id, { onDelete: "set null" }),
    trackingNumber: varchar("tracking_number", { length: 100 }),
    shippingFee: numeric("shipping_fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
    codAmountToCollect: numeric("cod_amount_to_collect", { precision: 10, scale: 2 }).notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, in_transit, delivered, delivery_failed, returned
    carrierNotes: text("carrier_notes"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    returnedAt: timestamp("returned_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("shipments_order_id_idx").on(table.orderId),
    index("shipments_tracking_idx").on(table.trackingNumber),
    index("shipments_status_idx").on(table.status),
  ]
);

export const codSettlements = pgTable(
  "cod_settlements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    carrierId: uuid("carrier_id").references(() => carriers.id, { onDelete: "set null" }),
    settlementReference: varchar("settlement_reference", { length: 100 }).notNull().unique(), // e.g. "SETTLE-2026-001"
    totalCollected: numeric("total_collected", { precision: 10, scale: 2 }).notNull(),
    carrierFees: numeric("carrier_fees", { precision: 10, scale: 2 }).notNull().default("0.00"),
    netAmountSettled: numeric("net_amount_settled", { precision: 10, scale: 2 }).notNull(),
    settlementDate: timestamp("settlement_date", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("cod_settlements_reference_idx").on(table.settlementReference),
  ]
);

export const codSettlementOrders = pgTable(
  "cod_settlement_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    settlementId: uuid("settlement_id")
      .notNull()
      .references(() => codSettlements.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    collectedAmount: numeric("collected_amount", { precision: 10, scale: 2 }).notNull(),
    carrierFee: numeric("carrier_fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("cod_settlement_orders_settlement_idx").on(table.settlementId),
    index("cod_settlement_orders_order_idx").on(table.orderId),
  ]
);

// ==========================================
// 7. CUSTOMER REVIEWS & INVITATIONS
// ==========================================
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    customerName: varchar("customer_name", { length: 100 }).notNull(),
    customerCity: varchar("customer_city", { length: 100 }),
    rating: integer("rating").notNull(), // 1 to 5
    headline: varchar("headline", { length: 255 }),
    comment: text("comment").notNull(),
    mediaUrls: jsonb("media_urls").notNull().default(sql`'[]'::jsonb`), // array of { url, type: "image" | "video" }
    isVerifiedPurchase: boolean("is_verified_purchase").notNull().default(false),
    status: varchar("status", { length: 30 }).notNull().default("pending"), // pending, approved, rejected, hidden
    invitationToken: varchar("invitation_token", { length: 100 }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("reviews_product_id_idx").on(table.productId),
    index("reviews_status_idx").on(table.status),
    index("reviews_invitation_token_idx").on(table.invitationToken),
  ]
);

export const reviewInvitations = pgTable(
  "review_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 100 }).notNull().unique(), // Secure random token
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("review_invitations_token_idx").on(table.token),
    index("review_invitations_order_id_idx").on(table.orderId),
  ]
);

// ==========================================
// 8. AFTER-SALES: RETURNS & EXCHANGES
// ==========================================
export const returns = pgTable(
  "returns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    returnNumber: varchar("return_number", { length: 50 }).notNull().unique(), // e.g. "RET-2611-001"
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
    reason: varchar("reason", { length: 100 }).notNull(), // defect, wrong_size, not_as_described, change_of_mind, other
    description: text("description").notNull(),
    evidenceMediaUrls: jsonb("evidence_media_urls").notNull().default(sql`'[]'::jsonb`),
    status: varchar("status", { length: 50 }).notNull().default("requested"), // requested, approved, rejected, received, inspected, completed, cancelled
    refundStatus: varchar("refund_status", { length: 50 }).notNull().default("not_applicable"), // not_applicable, pending, refunded
    refundAmount: numeric("refund_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("returns_number_idx").on(table.returnNumber),
    index("returns_order_id_idx").on(table.orderId),
    index("returns_status_idx").on(table.status),
  ]
);

export const returnItems = pgTable(
  "return_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    returnId: uuid("return_id")
      .notNull()
      .references(() => returns.id, { onDelete: "cascade" }),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    conditionNotes: text("condition_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("return_items_return_id_idx").on(table.returnId),
  ]
);

// ==========================================
// 9. SETTINGS & MARKETING ANALYTICS
// ==========================================
export const settings = pgTable(
  "settings",
  {
    key: varchar("key", { length: 100 }).primaryKey(),
    valueJson: jsonb("value_json").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: varchar("session_id", { length: 100 }).notNull(),
    eventName: varchar("event_name", { length: 100 }).notNull(), // page_view, pack_selected, checkout_started, order_completed
    pagePath: varchar("page_path", { length: 255 }).notNull(),
    landingPageId: uuid("landing_page_id").references(() => landingPages.id, { onDelete: "set null" }),
    offerId: uuid("offer_id").references(() => offers.id, { onDelete: "set null" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    metadataJson: jsonb("metadata_json").default({}),
    utmSource: varchar("utm_source", { length: 100 }),
    utmMedium: varchar("utm_medium", { length: 100 }),
    utmCampaign: varchar("utm_campaign", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("analytics_events_name_idx").on(table.eventName),
    index("analytics_events_created_at_idx").on(table.createdAt),
    index("analytics_events_landing_page_idx").on(table.landingPageId),
  ]
);

