"use client";

import React, { useState, useTransition } from "react";
import { formatMAD } from "@/lib/i18n";
import { updateOrderStatusAction } from "@/features/orders/admin-order-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Download,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  XCircle,
  Eye,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";

interface OrderItem {
  id: string;
  packSlotNumber: number;
  productTitle: string;
  variantTitle: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress: string | null;
  customerNotes: string | null;
  offerTitle: string;
  quantity: number;
  subtotalAmount: string;
  shippingFee: string;
  totalAmount: string;
  status: string;
  financialStatus: string;
  internalNotes: string | null;
  createdAt: string;
  items: OrderItem[];
  trackingNumber?: string | null;
  carrierName?: string | null;
}

interface OrdersTableProps {
  orders: AdminOrder[];
  carriers: Array<{ id: string; name: string }>;
  locale: string;
}

export function OrdersTable({ orders, carriers, locale }: OrdersTableProps) {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  // Status edit form state
  const [newStatus, setNewStatus] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrierId, setCarrierId] = useState(carriers[0]?.id || "");
  const [isPending, startTransition] = useTransition();
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [generatedReviewLink, setGeneratedReviewLink] = useState<string | null>(null);

  const statuses = [
    { key: "ALL", label: "Toutes" },
    { key: "NEW", label: "Nouvelles" },
    { key: "CONTACTED", label: "Contactées" },
    { key: "CONFIRMED", label: "Confirmées" },
    { key: "SHIPPED", label: "Expédiées" },
    { key: "DELIVERED", label: "Livrées" },
    { key: "CANCELLED", label: "Annulées" },
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      selectedStatus === "ALL" || o.status === selectedStatus;
    const matchesSearch =
      search === "" ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search) ||
      o.customerCity.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenDetail = (order: AdminOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setInternalNotes(order.internalNotes || "");
    setTrackingNumber(order.trackingNumber || "");
    setActionSuccess(null);
    setGeneratedReviewLink(null);
  };

  const handleSaveStatus = () => {
    if (!selectedOrder) return;
    setActionSuccess(null);

    startTransition(async () => {
      const res = await updateOrderStatusAction({
        orderId: selectedOrder.id,
        newStatus,
        notes: internalNotes,
        trackingNumber: trackingNumber || undefined,
        carrierId: carrierId || undefined,
      });

      if (res.success) {
        setActionSuccess("Statut mis à jour avec succès.");
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                internalNotes,
                trackingNumber: trackingNumber || prev.trackingNumber,
              }
            : null
        );
      }
    });
  };

  // Generate Review Invitation Link for delivered orders
  const handleGenerateReviewLink = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch("/api/reviews/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrder.id }),
      });
      const data = await res.json();
      if (data.success && data.inviteUrl) {
        setGeneratedReviewLink(window.location.origin + data.inviteUrl);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Export CSV for Moroccan carriers
  const handleExportCsv = () => {
    const headers = [
      "Référence Commande",
      "Nom Client",
      "Téléphone",
      "Ville",
      "Adresse",
      "Articles / Pack",
      "Montant COD à Encaisser (MAD)",
      "Statut",
      "Numéro de Suivi",
    ];

    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.customerPhone}"`,
      `"${o.customerCity}"`,
      `"${(o.customerAddress || "").replace(/"/g, '""')}"`,
      `"${o.offerTitle} (x${o.quantity})"`,
      o.totalAmount,
      o.status,
      o.trackingNumber || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `RAYANA-Commandes-Export-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par n°, nom, tél, ville..."
            className="pl-9 text-xs"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter CSV ({filteredOrders.length})
          </Button>
        </div>
      </div>

      {/* Status Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {statuses.map((st) => (
          <button
            key={st.key}
            onClick={() => setSelectedStatus(st.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedStatus === st.key
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-surface-container text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-container text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b border-border/60">
              <tr>
                <th className="py-3.5 px-4">Commande</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Client & Tél</th>
                <th className="py-3.5 px-4">Ville</th>
                <th className="py-3.5 px-4">Pack Sélectionné</th>
                <th className="py-3.5 px-4">Total COD</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    Aucune commande ne correspond à vos filtres.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    className="hover:bg-surface-container/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(ord.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground">
                        {ord.customerName}
                      </div>
                      <div className="text-muted-foreground font-mono text-[11px]">
                        {ord.customerPhone}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {ord.customerCity}
                    </td>
                    <td className="py-3 px-4">
                      <div className="truncate max-w-[200px] font-medium text-foreground">
                        {ord.offerTitle}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {ord.items.length} pièce(s) personnalisée(s)
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-primary text-sm">
                      {formatMAD(ord.totalAmount, locale)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          ord.status === "DELIVERED"
                            ? "success"
                            : ord.status === "NEW"
                            ? "warning"
                            : ord.status === "CANCELLED"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {ord.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetail(ord)}
                        className="h-8 text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Gérer
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Order Modal / Slide-over */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-card rounded-3xl border border-border shadow-2xl overflow-hidden my-8">
            <div className="p-6 bg-surface-container border-b border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold">
                  Détail Commande
                </span>
                <div className="text-xl font-black font-mono text-primary">
                  {selectedOrder.orderNumber}
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {actionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  {actionSuccess}
                </div>
              )}

              {/* Customer Info */}
              <div className="p-4 rounded-2xl bg-surface-container-low border border-border/60 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Client :</span>
                  <div className="font-bold text-sm text-foreground">
                    {selectedOrder.customerName}
                  </div>
                  <div className="text-primary font-mono font-bold mt-0.5">
                    {selectedOrder.customerPhone}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Ville & Adresse :</span>
                  <div className="font-bold text-sm text-foreground">
                    {selectedOrder.customerCity}
                  </div>
                  <div className="text-muted-foreground">
                    {selectedOrder.customerAddress || "Aucune adresse détaillée"}
                  </div>
                </div>
                {selectedOrder.customerNotes && (
                  <div className="col-span-2 pt-2 border-t border-border/60">
                    <span className="text-muted-foreground">
                      Instructions du client :
                    </span>
                    <p className="italic text-foreground mt-0.5">
                      "{selectedOrder.customerNotes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Exact Selected Pack Items & Variants */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Pièces & Variantes choisies (Pack : {selectedOrder.offerTitle})
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-surface-container border border-border flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                          {item.packSlotNumber}
                        </span>
                        <div>
                          <div className="font-bold text-foreground">
                            {item.productTitle}
                          </div>
                          <div className="text-muted-foreground">
                            Variante :{" "}
                            <span className="font-bold text-primary">
                              {item.variantTitle}
                            </span>{" "}
                            (SKU: {item.sku})
                          </div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-foreground">
                        {formatMAD(item.totalPrice, locale)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Update Form */}
              <div className="p-4 rounded-2xl bg-surface-container space-y-4 border border-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Mise à jour opérationnelle
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Changer le statut :
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs font-bold text-foreground"
                    >
                      <option value="NEW">NOUVELLE (NEW)</option>
                      <option value="CONTACTED">CONTACTÉE PAR TÉL</option>
                      <option value="CONFIRMED">CONFIRMÉE</option>
                      <option value="READY">PRÊTE À L'EXPÉDITION</option>
                      <option value="SHIPPED">EXPÉDIÉE AU TRANSPORTEUR</option>
                      <option value="DELIVERED">LIVRÉE AVEC SUCCÈS</option>
                      <option value="DELIVERY_FAILED">ÉCHEC DE LIVRAISON</option>
                      <option value="RETURNED">RETOURNÉE</option>
                      <option value="CANCELLED">ANNULÉE (RESTOCK)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Transporteur :
                    </label>
                    <select
                      value={carrierId}
                      onChange={(e) => setCarrierId(e.target.value)}
                      className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs text-foreground"
                    >
                      {carriers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Numéro de suivi transporteur (ex: Amana n° de tracking) :
                  </label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Ex: MA123456789"
                    className="font-mono text-xs uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Notes internes :
                  </label>
                  <Input
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Ex: Client confirmé au téléphone, demande livraison après 18h"
                    className="text-xs"
                  />
                </div>

                <Button
                  onClick={handleSaveStatus}
                  disabled={isPending}
                  className="w-full h-10 text-xs font-bold"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Enregistrer les modifications
                </Button>
              </div>

              {/* Review Invitation Generator */}
              {selectedOrder.status === "DELIVERED" && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Invitation d'avis client vérifié
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateReviewLink}
                      className="h-8 text-xs font-bold"
                    >
                      Générer le lien
                    </Button>
                  </div>
                  {generatedReviewLink && (
                    <div className="p-2.5 rounded-lg bg-card border border-border font-mono text-[11px] break-all select-all">
                      {generatedReviewLink}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
