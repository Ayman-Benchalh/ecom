"use client";

import React, { useState, useTransition } from "react";
import {
  updateStoreSettingsAction,
  changeAdminPasswordAction,
} from "@/features/auth/admin-settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Lock, Store, BarChart, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export function SettingsManager({
  initialSettings,
  adminEmail,
  locale,
}: {
  initialSettings: any;
  adminEmail: string;
  locale: string;
}) {
  const [storeName, setStoreName] = useState(initialSettings?.storeName || "RAYANA");
  const [whatsapp, setWhatsapp] = useState(initialSettings?.whatsappPhone || "+212 6 12 34 56 78");
  const [metaPixelId, setMetaPixelId] = useState(initialSettings?.metaPixelId || "");
  const [shippingFee, setShippingFee] = useState(initialSettings?.defaultShippingFee || 35);

  const [newPassword, setNewPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    startTransition(async () => {
      const res = await updateStoreSettingsAction({
        storeName,
        whatsappPhone: whatsapp,
        metaPixelId,
        defaultShippingFee: Number(shippingFee),
      });

      if (res.success) {
        setSuccessMsg("Paramètres de la boutique mis à jour avec succès.");
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    startTransition(async () => {
      const res = await changeAdminPasswordAction(newPassword);
      if (res.success) {
        setSuccessMsg("Mot de passe modifié avec succès.");
        setNewPassword("");
      } else {
        setErrorMsg(res.error || "Erreur lors de la modification.");
      }
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Store Identity & Tracking */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="py-4 px-6 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            Identité de la Boutique & Marketing
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSaveStore} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="stName">Nom de l'enseigne</Label>
                <Input
                  id="stName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="stPhone">Téléphone WhatsApp support</Label>
                <Input
                  id="stPhone"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="stPixel">Meta Pixel ID (Facebook / Instagram Ads)</Label>
                <Input
                  id="stPixel"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  placeholder="Ex: 123456789012345"
                  className="font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="stFee">Frais de livraison par défaut (MAD)</Label>
                <Input
                  id="stFee"
                  type="number"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(Number(e.target.value))}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="h-10 text-xs font-bold"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Enregistrer les modifications
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Admin Security & Password Change */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="py-4 px-6 border-b border-border/60">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Sécurité du Compte Administrateur ({adminEmail})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div className="space-y-1 max-w-sm">
              <Label htmlFor="newPass">Nouveau mot de passe administrateur :</Label>
              <Input
                id="newPass"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending || !newPassword}
              variant="outline"
              className="h-10 text-xs font-bold"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Mettre à jour le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
