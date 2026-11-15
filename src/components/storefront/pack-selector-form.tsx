"use client";

import React, { useState, useTransition, useId } from "react";
import { useRouter } from "next/navigation";
import { MOROCCAN_CITIES, formatMoroccanPhoneDisplay } from "@/lib/validation/morocco";
import { formatMAD, getDictionary, isRTL } from "@/lib/i18n";
import { submitCodOrderAction } from "@/features/orders/order-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ShieldCheck,
  Truck,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  Loader2,
  Phone,
  User,
  MapPin,
  ChevronDown,
} from "lucide-react";

export interface OfferSlotData {
  id: string;
  slotNumber: number;
  slotTitle: string;
  productId: string;
  product: {
    id: string;
    name: string;
  };
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    stockQuantity: number;
  }>;
}

export interface OfferData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  badge: string | null;
  offerType: string;
  fixedPrice: string;
  referencePrice: string | null;
  itemCount: number;
  freeShipping: boolean;
  isFeatured: boolean;
  slots: OfferSlotData[];
}

interface PackSelectorFormProps {
  offers: OfferData[];
  locale: string;
}

export function PackSelectorForm({ offers, locale }: PackSelectorFormProps) {
  const dict = getDictionary(locale);
  const rtl = isRTL(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Selected Offer (defaults to featured offer or first offer)
  const defaultOffer = offers.find((o) => o.isFeatured) || offers[0];
  const [selectedOfferId, setSelectedOfferId] = useState<string>(defaultOffer?.id || "");
  const currentOffer = offers.find((o) => o.id === selectedOfferId) || defaultOffer;

  // Selected Variant for each slot: { [slotNumber: number]: string (variantId) }
  const [selectedVariants, setSelectedVariants] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    if (defaultOffer) {
      defaultOffer.slots.forEach((slot, index) => {
        // Pick first in-stock variant or first variant
        const inStock = slot.variants.find((v) => v.stockQuantity > 0) || slot.variants[0];
        if (inStock) {
          // If 2nd slot and multiple variants, pick a different one for nice variety
          if (index === 1 && slot.variants.length > 1) {
            initial[slot.slotNumber] = slot.variants[1].id;
          } else {
            initial[slot.slotNumber] = inStock.id;
          }
        }
      });
    }
    return initial;
  });

  // Quantity
  const [quantity, setQuantity] = useState<number>(1);

  // Customer Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Casablanca");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Switch offer
  const handleSelectOffer = (offer: OfferData) => {
    setSelectedOfferId(offer.id);
    // Initialize variant selection for new slots
    const newSelections: Record<number, string> = {};
    offer.slots.forEach((slot, index) => {
      const inStock = slot.variants.find((v) => v.stockQuantity > 0) || slot.variants[0];
      if (inStock) {
        if (index === 1 && slot.variants.length > 1) {
          newSelections[slot.slotNumber] = slot.variants[1].id;
        } else {
          newSelections[slot.slotNumber] = inStock.id;
        }
      }
    });
    setSelectedVariants(newSelections);
  };

  // Select variant for a specific slot
  const handleSlotVariantChange = (slotNumber: number, variantId: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [slotNumber]: variantId,
    }));
  };

  // Submit Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentOffer) return;

    if (!fullName.trim()) {
      setErrorMsg(dict.checkout.fullNamePlaceholder);
      return;
    }

    if (!phone.trim()) {
      setErrorMsg("Veuillez renseigner un numéro de téléphone marocain.");
      return;
    }

    // Format selections payload
    const selectionsPayload = currentOffer.slots.map((s) => ({
      slotNumber: s.slotNumber,
      variantId: selectedVariants[s.slotNumber],
    }));

    // Generate unique idempotency key
    const idempotencyKey = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    startTransition(async () => {
      const res = await submitCodOrderAction({
        fullName,
        phone,
        city,
        address,
        notes,
        offerId: currentOffer.id,
        quantity,
        selectedVariants: selectionsPayload,
        idempotencyKey,
      });

      if (res.success && "orderNumber" in res && res.orderNumber) {
        // Redirect to order confirmation page
        router.push(`/${locale}/order/confirmation/${res.orderNumber}`);
      } else {
        setErrorMsg(("error" in res && res.error) || dict.checkout.submitError);
      }
    });
  };

  const unitPrice = currentOffer ? Number(currentOffer.fixedPrice) : 0;
  const subtotal = unitPrice * quantity;
  const shippingFee = currentOffer?.freeShipping ? 0 : 35.0;
  const total = subtotal + shippingFee;

  return (
    <div id="order-section" className="w-full space-y-8 scroll-mt-24">
      {/* 1. Pack Offer Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0">
            1
          </span>
          <h3 className="text-lg font-bold text-foreground">
            {dict.storefront.selectPack}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {offers.map((offer) => {
            const isSelected = offer.id === currentOffer?.id;
            return (
              <div
                key={offer.id}
                onClick={() => handleSelectOffer(offer)}
                className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 shadow-2xs select-none ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-4 ring-primary/10 shadow-md"
                    : "border-border bg-card hover:border-primary/50 hover:bg-surface-container-low"
                }`}
              >
                {/* Badge if featured / popular */}
                {offer.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-extrabold text-[11px] tracking-wider uppercase shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {offer.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="space-y-1">
                    <h4 className="font-bold text-base text-foreground">
                      {offer.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {offer.description}
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40 bg-card"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                </div>

                {/* Pricing Display */}
                <div className="mt-4 pt-3 border-t border-border/60 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-primary">
                      {formatMAD(offer.fixedPrice, locale)}
                    </span>
                    {offer.referencePrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatMAD(offer.referencePrice, locale)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    {offer.freeShipping ? "Livraison Gratuite" : "+35 DH"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Independent Variant Customizer (Critical Moroccan Pack Engine!) */}
      {currentOffer && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-foreground">
                {dict.storefront.customizePack}
              </h3>
              <p className="text-xs text-muted-foreground">
                Choisissez indépendamment la couleur et la taille pour chaque pièce de votre pack
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentOffer.slots.map((slot) => {
              const currentVariantId = selectedVariants[slot.slotNumber];
              const selectedVariant = slot.variants.find((v) => v.id === currentVariantId);

              return (
                <div
                  key={slot.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                      {dict.packSelector.piece} {slot.slotNumber}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {selectedVariant?.title || "Sélectionnez"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Sélectionnez la variante :
                    </Label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {slot.variants.map((variant) => {
                        const isChosen = variant.id === currentVariantId;
                        const isOutOfStock = variant.stockQuantity <= 0;

                        return (
                          <button
                            key={variant.id}
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() =>
                              handleSlotVariantChange(slot.slotNumber, variant.id)
                            }
                            className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                              isChosen
                                ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                                : isOutOfStock
                                ? "border-border/40 bg-muted/40 text-muted-foreground line-through cursor-not-allowed opacity-50"
                                : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-surface-container"
                            }`}
                          >
                            <div className="truncate">{variant.title}</div>
                            <div
                              className={`text-[10px] mt-0.5 ${
                                isChosen
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {isOutOfStock ? "Épuisé" : `En stock (${variant.stockQuantity})`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Minimal Moroccan COD Checkout Form */}
      <form onSubmit={handleSubmitOrder} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0">
              3
            </span>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-foreground">
                {dict.storefront.customerDetails}
              </h3>
              <p className="text-xs text-muted-foreground">
                Pas besoin de compte ni de mot de passe. Remplissez simplement vos coordonnées de livraison.
              </p>
            </div>
          </div>

          <Card className="border-2 border-border shadow-md">
            <CardContent className="p-6 space-y-4">
              {/* Error Alert */}
              {errorMsg && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Attention : </strong>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="flex items-center gap-1.5 text-xs">
                    <User className="w-3.5 h-3.5 text-primary" />
                    {dict.checkout.fullName} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={dict.checkout.fullNamePlaceholder}
                  />
                </div>

                {/* Moroccan Phone Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    {dict.checkout.phone} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={dict.checkout.phonePlaceholder}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {dict.checkout.phoneHelp}
                  </p>
                </div>
              </div>

              {/* City Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="flex items-center gap-1.5 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {dict.checkout.city} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <select
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full h-12 rounded-xl border border-input bg-card px-4 py-2 text-base text-foreground appearance-none pr-10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring font-medium"
                    >
                      {MOROCCAN_CITIES.map((c) => (
                        <option key={c.id} value={c.nameFr}>
                          {c.nameFr} ({c.nameAr})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <Label htmlFor="quantity" className="text-xs">
                    Nombre de packs souhaité :
                  </Label>
                  <div className="flex items-center h-12 border border-input rounded-xl bg-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-12 h-full flex items-center justify-center font-bold text-lg hover:bg-surface-container active:bg-muted"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-bold text-base">
                      {quantity}
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                      className="w-12 h-full flex items-center justify-center font-bold text-lg hover:bg-surface-container active:bg-muted"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Address & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs">
                    {dict.checkout.address}
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={dict.checkout.addressPlaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs">
                    {dict.checkout.notes}
                  </Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={dict.checkout.notesPlaceholder}
                  />
                </div>
              </div>

              {/* Order Summary & Authoritative Pricing */}
              <div className="p-4 rounded-xl bg-surface-container space-y-2 border border-border/60">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{currentOffer?.title} (x{quantity})</span>
                  <span>{formatMAD(subtotal, locale)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{dict.checkout.shipping}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {shippingFee === 0 ? dict.checkout.free : formatMAD(shippingFee, locale)}
                  </span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between items-baseline font-extrabold text-foreground">
                  <span className="text-sm">{dict.checkout.total} :</span>
                  <span className="text-2xl text-primary font-black">
                    {formatMAD(total, locale)}
                  </span>
                </div>
              </div>

              {/* COD Moroccan Reassurance Banner */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Paiement à la livraison 100% garanti :</strong> {dict.checkout.codNotice}
                </p>
              </div>

              {/* Main Submit CTA Button */}
              <Button
                type="submit"
                variant="cta"
                size="lg"
                disabled={isPending}
                className="w-full h-14 text-base font-extrabold shadow-xl hover:shadow-2xl transition-all cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {dict.storefront.orderProcessing}
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    {dict.storefront.confirmOrder} — {formatMAD(total, locale)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Sticky Mobile Purchase Bar (Always on screen on mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-background/95 backdrop-blur-md border-t border-border shadow-2xl md:hidden">
        <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">
              Total à payer
            </span>
            <span className="text-xl font-black text-primary leading-none">
              {formatMAD(total, locale)}
            </span>
          </div>
          <Button
            type="button"
            variant="cta"
            onClick={() => {
              const el = document.getElementById("order-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="h-11 px-6 font-bold shadow-md cursor-pointer"
          >
            Commander Maintenant
          </Button>
        </div>
      </div>
    </div>
  );
}
