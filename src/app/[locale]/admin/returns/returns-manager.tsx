"use client";

import React, { useState, useTransition } from "react";
import { updateReturnStatusAction } from "@/features/returns/admin-return-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Check, X, Loader2 } from "lucide-react";

export interface ReturnItemData {
  id: string;
  returnNumber: string;
  orderNumber: string;
  customerPhone: string;
  reason: string;
  description: string;
  evidenceMediaUrls: any;
  status: string;
  refundStatus: string;
  refundAmount: string;
  adminNotes: string | null;
  createdAt: string;
}

export function ReturnsManager({
  returnsList,
  locale,
}: {
  returnsList: ReturnItemData[];
  locale: string;
}) {
  const [list, setList] = useState(returnsList);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (returnId: string, status: any) => {
    startTransition(async () => {
      const res = await updateReturnStatusAction({ returnId, status });
      if (res.success) {
        setList((prev) =>
          prev.map((r) => (r.id === returnId ? { ...r, status } : r))
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-container text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b border-border/60">
              <tr>
                <th className="py-3 px-4">Dossier SAV</th>
                <th className="py-3 px-4">Commande</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4">Motif</th>
                <th className="py-3 px-4">Détails</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Décision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Aucune demande de retour ou d'échange enregistrée.
                  </td>
                </tr>
              ) : (
                list.map((ret) => (
                  <tr key={ret.id} className="hover:bg-surface-container/50">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {ret.returnNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground font-semibold">
                      {ret.orderNumber}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-foreground">
                      {ret.customerPhone}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground">
                        {ret.reason}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-muted-foreground truncate">
                      {ret.description}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          ret.status === "approved"
                            ? "success"
                            : ret.status === "rejected"
                            ? "destructive"
                            : "warning"
                        }
                        className="text-[10px] uppercase font-bold"
                      >
                        {ret.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {ret.status === "requested" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleUpdate(ret.id, "rejected")}
                            className="h-7 text-xs text-destructive"
                          >
                            Rejeter
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            disabled={isPending}
                            onClick={() => handleUpdate(ret.id, "approved")}
                            className="h-7 text-xs font-bold"
                          >
                            Approuver l'échange
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

