"use client";

import React, { useState, useTransition } from "react";
import { formatMAD } from "@/lib/i18n";
import { createCodSettlementAction } from "@/features/delivery/admin-carrier-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, DollarSign, CheckCircle2, Plus, Loader2 } from "lucide-react";

export interface CarrierData {
  id: string;
  name: string;
  phone: string | null;
  defaultShippingFee: string;
  isActive: boolean;
}

export interface SettlementData {
  id: string;
  carrierName: string | null;
  settlementReference: string;
  totalCollected: string;
  carrierFees: string;
  netAmountSettled: string;
  settlementDate: string;
}

export interface UnsettledOrderData {
  id: string;
  orderNumber: string;
  totalAmount: string;
  customerCity: string;
}

export function CarriersManager({
  carriers,
  settlements,
  unsettledOrders,
  locale,
}: {
  carriers: CarrierData[];
  settlements: SettlementData[];
  unsettledOrders: UnsettledOrderData[];
  locale: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [carrierId, setCarrierId] = useState(carriers[0]?.id || "");
  const [reference, setReference] = useState(`SETTLE-${Date.now().toString().slice(-4)}`);
  const [carrierFees, setCarrierFees] = useState("70");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>(
    unsettledOrders.map((o) => o.id)
  );
  const [isPending, startTransition] = useTransition();

  const totalCollectedSum = unsettledOrders
    .filter((o) => selectedOrderIds.includes(o.id))
    .reduce((acc, o) => acc + Number(o.totalAmount), 0);

  const netSettled = Math.max(0, totalCollectedSum - parseFloat(carrierFees || "0"));

  const handleCreateSettlement = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await createCodSettlementAction({
        carrierId,
        settlementReference: reference,
        totalCollected: totalCollectedSum,
        carrierFees: parseFloat(carrierFees || "0"),
        orderIds: selectedOrderIds,
      });

      if (res.success) {
        setShowModal(false);
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* 1. Carriers List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          Transporteurs & Prestataires Logistiques Partenaires
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {carriers.map((c) => (
            <Card key={c.id} className="border border-border shadow-2xs">
              <CardContent className="p-5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-base text-foreground">
                    {c.name}
                  </h4>
                  <Badge variant="success" className="text-[10px]">
                    Actif
                  </Badge>
                </div>
                <div className="text-muted-foreground">
                  Frais standard :{" "}
                  <strong className="text-foreground">
                    {formatMAD(c.defaultShippingFee, locale)}
                  </strong>
                </div>
                {c.phone && (
                  <div className="text-muted-foreground">
                    Téléphone : <strong className="text-foreground">{c.phone}</strong>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 2. COD Reconciliation Ledger */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Rapprochement Financier des Espèces Encaissées (COD)
          </h3>
          {unsettledOrders.length > 0 && (
            <Button
              size="sm"
              onClick={() => setShowModal(true)}
              className="text-xs font-bold"
            >
              <Plus className="w-4 h-4 mr-1" />
              Enregistrer un Virement Transporteur ({unsettledOrders.length} colis)
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-container text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b border-border/60">
              <tr>
                <th className="py-3 px-4">Référence Bordereau</th>
                <th className="py-3 px-4">Transporteur</th>
                <th className="py-3 px-4">Date de Règlement</th>
                <th className="py-3 px-4">Total Encaissé (Client)</th>
                <th className="py-3 px-4">Frais de Port Déduits</th>
                <th className="py-3 px-4 text-right">Net Reçu par RAYANA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground">
                    Aucun bordereau de rapprochement enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-container/50">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {s.settlementReference}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {s.carrierName || "Amana Express"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(s.settlementDate).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-foreground">
                      {formatMAD(s.totalCollected, locale)}
                    </td>
                    <td className="py-3 px-4 font-mono text-destructive">
                      - {formatMAD(s.carrierFees, locale)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right text-sm">
                      {formatMAD(s.netAmountSettled, locale)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal create settlement */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card rounded-3xl border border-border p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">
                Enregistrer un Rapprochement COD
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSettlement} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label>Transporteur :</Label>
                <select
                  value={carrierId}
                  onChange={(e) => setCarrierId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs"
                >
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Référence du bordereau / virement :</Label>
                <Input
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="font-mono uppercase text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label>Frais de livraison facturés par le transporteur (MAD) :</Label>
                <Input
                  required
                  type="number"
                  value={carrierFees}
                  onChange={(e) => setCarrierFees(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-surface-container space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Colis livrés sélectionnés :</span>
                  <span>{selectedOrderIds.length}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Total espèces collectées :</span>
                  <span className="font-mono">{formatMAD(totalCollectedSum, locale)}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between font-bold text-sm text-foreground">
                  <span>Net versé sur compte bancaire :</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatMAD(netSettled, locale)}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 text-xs font-bold"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Valider le Rapprochement
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
