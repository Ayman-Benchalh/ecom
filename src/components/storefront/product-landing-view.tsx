"use client";

import React, { useState } from "react";
import Image from "next/image";
import { formatMAD, getDictionary, isRTL } from "@/lib/i18n";
import { PackSelectorForm, OfferData } from "./pack-selector-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Play,
  Award,
  ChevronDown,
} from "lucide-react";

interface ProductLandingViewProps {
  product: {
    id: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    description: string | null;
    sellingPrice: string;
    referencePrice: string | null;
    badge: string | null;
    images: any;
    videoUrl?: string | null;
  };
  offers: OfferData[];
  reviews: Array<{
    id: string;
    customerName: string;
    customerCity: string | null;
    rating: number;
    headline: string | null;
    comment: string;
    isVerifiedPurchase: boolean;
  }>;
  locale: string;
}

export function ProductLandingView({
  product,
  offers,
  reviews,
  locale,
}: ProductLandingViewProps) {
  const dict = getDictionary(locale);
  const rtl = isRTL(locale);

  // Gallery active image state
  const imagesList = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [
        {
          url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
          alt: product.name,
        },
      ];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = imagesList[activeImageIndex] || imagesList[0];

  // FAQ open state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Comment se déroule la livraison au Maroc ?",
      a: "Votre commande est expédiée sous 24h à 48h ouvrables. Le livreur vous contacte obligatoirement par téléphone pour convenir de l'horaire précis avant son passage.",
    },
    {
      q: "Puis-je payer en espèces à la réception (Cash on Delivery) ?",
      a: "Absolument. Vous ne payez rien lors de votre commande en ligne. Vous réglez directement le livreur en espèces à la livraison de votre colis.",
    },
    {
      q: "Et si la taille ne me convient pas ?",
      a: "Nous offrons une garantie satisfaction avec échange de taille sous 7 jours. Il vous suffit de nous contacter ou de faire une demande d'échange en ligne.",
    },
    {
      q: "Puis-je choisir des couleurs ou tailles différentes dans un même pack ?",
      a: "Oui, c'est l'un des grands avantages de RAYANA ! Pour chaque pièce de votre pack, vous choisissez librement et indépendamment la couleur et la taille de votre choix.",
    },
  ];

  return (
    <div className="w-full pb-20">
      {/* 1. Hero Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Gallery Col */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-muted border border-border shadow-md">
              <img
                src={activeImage.url}
                alt={activeImage.alt || product.name}
                className="w-full h-full object-cover object-center transition-all duration-300"
              />
              {product.badge && (
                <div className="absolute top-4 left-4">
                  <Badge variant="morocco" className="text-xs px-3 py-1 shadow-md">
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    {product.badge}
                  </Badge>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {imagesList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {imagesList.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-primary ring-2 ring-primary/20 scale-105"
                        : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || `Vue ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Highlights */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-foreground">
                  4.9/5
                </span>
                <span className="text-xs text-muted-foreground">
                  ({reviews.length > 0 ? reviews.length : "142"} avis vérifiés au Maroc)
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground font-serif leading-tight">
                {product.name}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {product.shortDescription}
              </p>
            </div>

            {/* Key Quality Pillars */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-surface-container border border-border/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>100% Coton Peigné 240 GSM</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Coupe Confort Anti-Déformation</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Adapté au Climat Marocain</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Teintures Écologiques Certifiées</span>
              </div>
            </div>

            {/* Quick Action to Order */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wide">
                  Offre Recommandée (Pack Duo)
                </span>
                <div className="text-2xl font-black text-foreground">
                  169.00 MAD{" "}
                  <span className="text-xs text-muted-foreground line-through font-normal">
                    198.00 MAD
                  </span>
                </div>
              </div>
              <Button
                variant="cta"
                size="lg"
                onClick={() => {
                  const el = document.getElementById("order-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto font-bold shadow-md cursor-pointer"
              >
                Commander Maintenant (COD)
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Pack Selector & COD Checkout */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PackSelectorForm offers={offers} locale={locale} />
      </section>

      {/* 3. Verified Customer Reviews */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-border mt-12">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
          <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider">
            {dict.reviews.verifiedBuyer}
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground font-serif">
            {dict.reviews.title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {dict.reviews.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  {rev.isVerifiedPurchase && (
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 mr-0.5" />
                      Vérifié
                    </span>
                  )}
                </div>

                {rev.headline && (
                  <h4 className="font-bold text-sm text-foreground">
                    "{rev.headline}"
                  </h4>
                )}

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {rev.comment}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-foreground">
                <span>{rev.customerName}</span>
                {rev.customerCity && (
                  <span className="text-muted-foreground font-normal">
                    {rev.customerCity}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Frequently Asked Questions (FAQ) */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-extrabold text-foreground font-serif">
            Questions Fréquentes
          </h2>
          <p className="text-xs text-muted-foreground">
            Tout ce que vous devez savoir avant de commander
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-border bg-card overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-foreground hover:bg-surface-container cursor-pointer select-none"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
