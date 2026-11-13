"use client";

import React, { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
} from "lucide-react";

export default function CustomerReturnsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const dict = getDictionary(locale);
  const router = useRouter();

  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("wrong_size");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const [isPending, startTransition] = useTransition();
  const [returnNumber, setReturnNumber] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!orderNumber.trim() || !phone.trim() || !description.trim()) {
      setErrorMsg("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/returns/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: orderNumber.trim(),
            phone: phone.trim(),
            reason,
            description: description.trim(),
            evidenceMediaUrls: evidenceUrl ? [evidenceUrl] : [],
          }),
        });

        const data = await res.json();
        if (data.success && data.returnNumber) {
          setReturnNumber(data.returnNumber);
        } else {
          setErrorMsg(data.error || "Erreur lors de l'enregistrement de votre demande.");
        }
      } catch (err) {
        setErrorMsg("Erreur réseau. Veuillez réessayer.");
      }
    });
  };

  if (returnNumber) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground font-serif">
          Demande d'échange / retour enregistrée !
        </h1>
        <p className="text-xs text-muted-foreground uppercase font-bold">
          Dossier SAV n°
        </p>
        <div className="text-xl font-black text-primary font-mono">
          {returnNumber}
        </div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          {dict.returns.returnSuccess}
        </p>
        <div className="pt-4">
          <Button onClick={() => router.push(`/${locale}`)}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
          <RotateCcw className="w-4 h-4" />
          <span>Garantie 7 Jours Satisfait ou Échangé</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-serif">
          {dict.returns.title}
        </h1>
        <p className="text-xs text-muted-foreground">
          {dict.returns.subtitle}
        </p>
      </div>

      <Card className="border border-border shadow-xs">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="orderNumber" className="text-xs">
                {dict.returns.orderNumber} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="orderNumber"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="RY-2611-XXXX"
                className="font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs">
                {dict.returns.phone} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 12 34 56 78"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason" className="text-xs">
                {dict.returns.reason} <span className="text-destructive">*</span>
              </Label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-12 rounded-xl border border-input bg-card px-4 py-2 text-sm text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="wrong_size">
                  {dict.returns.reasons.wrong_size}
                </option>
                <option value="defect">
                  {dict.returns.reasons.defect}
                </option>
                <option value="not_as_described">
                  {dict.returns.reasons.not_as_described}
                </option>
                <option value="change_of_mind">
                  {dict.returns.reasons.change_of_mind}
                </option>
                <option value="other">
                  {dict.returns.reasons.other}
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs">
                {dict.returns.description} <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="description"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Indiquez la taille souhaitée pour l'échange ou le motif..."
                className="w-full rounded-xl border border-input bg-card p-3 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="evidence" className="text-xs">
                Lien photo du produit (Optionnel)
              </Label>
              <Input
                id="evidence"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 text-sm font-bold cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Enregistrement...
                </>
              ) : (
                dict.returns.submitReturn
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
