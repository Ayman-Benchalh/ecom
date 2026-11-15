"use client";

import React, { useState, useTransition } from "react";
import { formatMAD } from "@/lib/i18n";
import {
  adjustVariantStockAction,
  createNewProductAction,
} from "@/features/products/admin-product-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Plus,
  Layers,
  Sparkles,
  Edit,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export interface VariantData {
  id: string;
  sku: string;
  title: string;
  stockQuantity: number;
  status: string;
}

export interface ProductData {
  id: string;
  name: string;
  slug: string;
  sku: string;
  sellingPrice: string;
  referencePrice: string | null;
  status: string;
  badge: string | null;
  variants: VariantData[];
}

export function ProductsManager({
  products,
  locale,
}: {
  products: ProductData[];
  locale: string;
}) {
  const [productList, setProductList] = useState(products);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create Product Form
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [sellingPrice, setSellingPrice] = useState("129");
  const [referencePrice, setReferencePrice] = useState("189");
  const [shortDesc, setShortDesc] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const handleStockAdjust = (variantId: string, delta: number) => {
    startTransition(async () => {
      const res = await adjustVariantStockAction({
        variantId,
        delta,
        reason: "manual_adjustment",
      });

      if (res.success && res.newStock !== undefined) {
        setProductList((prev) =>
          prev.map((p) => ({
            ...p,
            variants: p.variants.map((v) =>
              v.id === variantId ? { ...v, stockQuantity: res.newStock! } : v
            ),
          }))
        );
      }
    });
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    startTransition(async () => {
      try {
        const res = await createNewProductAction({
          name: name.trim(),
          sku: sku.trim(),
          sellingPrice: parseFloat(sellingPrice),
          referencePrice: referencePrice ? parseFloat(referencePrice) : undefined,
          shortDescription: shortDesc.trim(),
          badge: "Nouveau",
        });

        if (res.success) {
          setShowCreateModal(false);
          window.location.reload();
        } else {
          setCreateError("Erreur lors de la création du produit.");
        }
      } catch (err: any) {
        setCreateError(err.message || "Erreur serveur.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {productList.length} produit(s) au catalogue
        </p>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="text-xs font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Ajouter un Produit
        </Button>
      </div>

      {/* Products and Variants List */}
      <div className="space-y-6">
        {productList.map((prod) => (
          <Card key={prod.id} className="border border-border shadow-xs overflow-hidden">
            <CardHeader className="bg-surface-container py-4 px-6 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-foreground">
                      {prod.name}
                    </h3>
                    {prod.badge && (
                      <Badge variant="morocco" className="text-[10px]">
                        {prod.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    SKU: {prod.sku} • Slug: /{prod.slug}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-base font-black text-primary font-mono">
                    {formatMAD(prod.sellingPrice, locale)}
                  </div>
                  {prod.referencePrice && (
                    <div className="text-[11px] text-muted-foreground line-through">
                      {formatMAD(prod.referencePrice, locale)}
                    </div>
                  )}
                </div>
                <Badge
                  variant={prod.status === "active" ? "success" : "outline"}
                  className="text-[10px] uppercase font-bold"
                >
                  {prod.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Variantes & Stocks Disponibles ({prod.variants.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {prod.variants.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl border border-border bg-card flex flex-col justify-between space-y-2 shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-xs text-foreground truncate">
                        {v.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {v.sku}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">
                          Stock
                        </span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            v.stockQuantity <= 5
                              ? "text-destructive"
                              : "text-foreground"
                          }`}
                        >
                          {v.stockQuantity} unités
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isPending || v.stockQuantity <= 0}
                          onClick={() => handleStockAdjust(v.id, -1)}
                          className="w-7 h-7 rounded-lg bg-surface-container hover:bg-muted font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleStockAdjust(v.id, 5)}
                          className="w-7 h-7 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-3xl border border-border p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">
                Ajouter un Nouveau Produit
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              {createError && (
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs">
                  {createError}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="pName">Nom du produit</Label>
                <Input
                  id="pName"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Polo Piqué Signature RAYANA"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="pSku">Code SKU de base</Label>
                <Input
                  id="pSku"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Ex: RY-POLO-001"
                  className="font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pPrice">Prix de vente (MAD)</Label>
                  <Input
                    id="pPrice"
                    required
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pRefPrice">Prix barré (MAD)</Label>
                  <Input
                    id="pRefPrice"
                    type="number"
                    value={referencePrice}
                    onChange={(e) => setReferencePrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="pDesc">Courte description</Label>
                <Input
                  id="pDesc"
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="Ex: 100% Coton peigné haut de gamme..."
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 text-xs font-bold"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Créer et générer les variantes (S, M, L, XL)
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

