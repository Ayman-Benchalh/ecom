"use client";

import React, { useState, useTransition } from "react";
import { formatMAD, getDictionary } from "@/lib/i18n";
import { normalizeMoroccanPhone } from "@/lib/validation/morocco";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  PhoneCall,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";

export default function TrackOrderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("fr");
  React.useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  const dict = getDictionary(locale);

  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setOrderData(null);

    if (!orderNumber.trim()) {
      setErrorMsg("Veuillez entrer votre numéro de commande.");
      return;
    }

    if (!phone.trim()) {
      setErrorMsg("Veuillez entrer votre numéro de téléphone.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/orders/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber: orderNumber.trim(), phone: phone.trim() }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMsg(data.error || "Aucune commande trouvée avec ces identifiants.");
        } else {
          setOrderData(data.order);
        }
      } catch (err) {
        setErrorMsg("Erreur réseau. Veuillez réessayer.");
      }
    });
  };

  const getStatusStep = (status: string) => {
    const steps = [
      { key: "NEW", label: "Commande Reçue", icon: Clock },
      { key: "CONTACTED", label: "Contact Téléphonique", icon: PhoneCall },
      { key: "CONFIRMED", label: "Confirmée", icon: CheckCircle2 },
      { key: "SHIPPED", label: "En cours de livraison", icon: Truck },
      { key: "DELIVERED", label: "Livrée", icon: Package },
    ];

    const statusOrder: Record<string, number> = {
      NEW: 0,
      CONTACTED: 1,
      CONFIRMED: 2,
      READY: 2,
      SHIPPED: 3,
      DELIVERED: 4,
    };

    const currentIdx = statusOrder[status] ?? 0;

    return { steps, currentIdx };
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-serif">
          {dict.nav.tracking}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Vérifiez l'état d'avancement de votre commande en temps réel
        </p>
      </div>

      {/* Lookup Card */}
      <Card className="border border-border shadow-xs">
        <CardContent className="p-6">
          <form onSubmit={handleLookup} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="orderNumber" className="text-xs">
                Numéro de commande (ex: RY-2611-0001)
              </Label>
              <Input
                id="orderNumber"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="RY-XXXX-XXXX"
                className="font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs">
                Numéro de téléphone utilisé lors de la commande
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

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 text-sm font-bold cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Recherche en cours...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Vérifier l'état de la commande
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Result Display */}
      {orderData && (
        <Card className="border-2 border-primary/20 shadow-md animate-in fade-in duration-300">
          <CardHeader className="bg-surface-container py-4 px-6 border-b border-border/60 flex flex-row items-center justify-between">
            <div>
              <span className="text-[11px] text-muted-foreground uppercase font-bold">
                Commande
              </span>
              <div className="text-base font-black text-primary font-mono">
                {orderData.orderNumber}
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-bold px-3 py-1 bg-card">
              Statut : {orderData.status}
            </Badge>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Status Stepper */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Progression de la livraison
              </h4>

              <div className="grid grid-cols-5 gap-2 text-center">
                {getStatusStep(orderData.status).steps.map((st, i) => {
                  const isCurrent = i === getStatusStep(orderData.status).currentIdx;
                  const isCompleted = i <= getStatusStep(orderData.status).currentIdx;
                  const Icon = st.icon;

                  return (
                    <div key={st.key} className="flex flex-col items-center space-y-2">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-surface-container text-muted-foreground border border-border"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] leading-tight font-medium ${
                          isCurrent
                            ? "text-primary font-bold"
                            : isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tracking details if shipped */}
            {orderData.trackingNumber && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">
                    Transporteur & Numéro de suivi :
                  </span>
                  <div className="font-bold text-sm text-foreground">
                    {orderData.carrierName || "Amana Express"} — {orderData.trackingNumber}
                  </div>
                </div>
                {orderData.trackingUrl && (
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={orderData.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Suivi Colis
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* Details Summary */}
            <div className="pt-4 border-t border-border/60 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client :</span>
                <span className="font-semibold text-foreground">
                  {orderData.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ville de livraison :</span>
                <span className="font-semibold text-foreground">
                  {orderData.customerCity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Articles :</span>
                <span className="font-semibold text-foreground">
                  {orderData.offerTitle} (x{orderData.quantity})
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border/40 font-bold text-sm">
                <span>Montant à régler à la livraison :</span>
                <span className="text-primary font-mono">
                  {formatMAD(orderData.totalAmount, locale)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
