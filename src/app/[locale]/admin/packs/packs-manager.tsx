"use client";

import React, { useState, useTransition } from "react";
import { formatMAD } from "@/lib/i18n";
import { createPackOfferAction } from "@/features/offers/admin-offer-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  Plus,
  Sparkles,
  CheckCircle2,
  Loader2,
  PackageCheck,
} from "lucide-react";

export interface PackItemData {
  id: string;
  title: string;
  slug: string;
  fixedPrice: string;
  referencePrice: string | null;
  itemCount: number;
  badge: string | null;
  freeShipping: boolean;
  isFeatured: boolean;
  productName: string;
  slotsCount: number;
}

export function PacksManager({
  packs,
  products,
  locale,
}: {
  packs: PackItemData[];
  products: Array<{ id: string; name: string }>;
  locale: string;
}) {
  const [packList, setPackList] = useState(packs);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // New Pack Form
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [title, setTitle] = useState("");
  const [fixedPrice, setFixedPrice] = useState("169");
  const [referencePrice, setReferencePrice] = useState("198");
  const [itemCount, setItemCount] = useState(2);
  const [badge, setBadge] = useState("Plus Populaire");
  const [freeShipping, setFreeShipping] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const handleCreatePack = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await createPackOfferAction({
        productId,
        title: title.trim(),
        fixedPrice: parseFloat(fixedPrice),
        referencePrice: referencePrice ? parseFloat(referencePrice) : undefined,
        itemCount,
        badge: badge.trim() || undefined,
        freeShipping,
        isFeatured,
      });

      if (res.success) {
        setShowModal(false);
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {packList.length} offre(s) & pack(s) configurés
        </p>
        <Button
          onClick={() => setShowModal(true)}
          className="text-xs font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Créer un Pack / Bundle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packList.map((pk) => (
          <Card
            key={pk.id}
            className={`border-2 shadow-xs transition-shadow ${
              pk.isFeatured ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <CardHeader className="py-4 px-5 border-b border-border/60">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-foreground">
                    {pk.title}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Produit : {pk.productName}
                  </span>
                </div>
                {pk.badge && (
                  <Badge variant="morocco" className="text-[10px]">
                    {pk.badge}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-primary font-mono">
                    {formatMAD(pk.fixedPrice, locale)}
                  </span>
                  {pk.referencePrice && (
                    <span className="text-xs text-muted-foreground line-through ml-2">
                      {formatMAD(pk.referencePrice, locale)}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {pk.freeShipping ? "Livraison Gratuite" : "+35 DH"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-container border border-border/60 space-y-1.5">
                <div className="flex justify-between font-bold text-foreground">
                  <span>Pièces personnalisables :</span>
                  <span className="text-primary font-mono">{pk.itemCount} pièce(s)</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Le client peut choisir une taille et une couleur différente pour chacune des {pk.itemCount} pièces.
                </p>
              </div>

              {pk.isFeatured && (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Offre mise en avant (sélectionnée par défaut)</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal create pack */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-3xl border border-border p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">
                Créer un Nouveau Pack
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePack} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="pkProduct">Produit associé</Label>
                <select
                  id="pkProduct"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-input bg-card px-3 text-xs text-foreground"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="pkTitle">Titre du pack</Label>
                <Input
                  id="pkTitle"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pack Duo — 2 T-shirts Coton Bio"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pkItems">Nombre de pièces</Label>
                  <select
                    id="pkItems"
                    value={itemCount}
                    onChange={(e) => setItemCount(parseInt(e.target.value, 10))}
                    className="w-full h-11 rounded-xl border border-input bg-card px-3 text-xs text-foreground font-bold"
                  >
                    <option value={1}>1 pièce (Offre Standard)</option>
                    <option value={2}>2 pièces (Pack Duo)</option>
                    <option value={3}>3 pièces (Pack Trio)</option>
                    <option value={4}>4 pièces (Pack Famille)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="pkBadge">Badge publicitaire</Label>
                  <Input
                    id="pkBadge"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Ex: -30% • Plus Populaire"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pkPrice">Prix total pack (MAD)</Label>
                  <Input
                    id="pkPrice"
                    required
                    type="number"
                    value={fixedPrice}
                    onChange={(e) => setFixedPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pkRef">Prix barré (MAD)</Label>
                  <Input
                    id="pkRef"
                    type="number"
                    value={referencePrice}
                    onChange={(e) => setReferencePrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={freeShipping}
                    onChange={(e) => setFreeShipping(e.target.checked)}
                    className="rounded-sm"
                  />
                  <span>Livraison gratuite offerte sur ce pack</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded-sm"
                  />
                  <span>Définir comme offre vedette (sélectionnée par défaut)</span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 text-xs font-bold"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Enregistrer le Pack
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

