"use client";

import React, { useState, useTransition } from "react";
import { moderateReviewAction } from "@/features/reviews/admin-review-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShieldCheck, Check, X, EyeOff, Loader2 } from "lucide-react";

export interface ReviewItemData {
  id: string;
  customerName: string;
  customerCity: string | null;
  rating: number;
  headline: string | null;
  comment: string;
  mediaUrls: any;
  isVerifiedPurchase: boolean;
  status: string;
  createdAt: string;
}

export function ReviewsManager({
  reviews,
  locale,
}: {
  reviews: ReviewItemData[];
  locale: string;
}) {
  const [reviewList, setReviewList] = useState(reviews);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();

  const filtered = reviewList.filter((r) =>
    selectedFilter === "ALL" ? true : r.status === selectedFilter
  );

  const handleModerate = (reviewId: string, status: "approved" | "rejected" | "hidden") => {
    startTransition(async () => {
      const res = await moderateReviewAction({ reviewId, status });
      if (res.success) {
        setReviewList((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, status } : r))
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["ALL", "pending", "approved", "rejected"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedFilter(st)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase transition-colors cursor-pointer ${
              selectedFilter === st
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "bg-surface-container text-muted-foreground hover:bg-muted"
            }`}
          >
            {st === "ALL" ? "Tous les avis" : st}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-muted-foreground text-xs">
            Aucun avis dans cette catégorie.
          </div>
        ) : (
          filtered.map((rev) => (
            <Card key={rev.id} className="border border-border shadow-2xs space-y-3">
              <CardHeader className="py-3 px-5 border-b border-border/60 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {rev.customerName}
                    </span>
                    {rev.customerCity && (
                      <span className="text-xs text-muted-foreground">
                        ({rev.customerCity})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-amber-500 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted/40 fill-transparent"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {rev.isVerifiedPurchase && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      Vérifié
                    </span>
                  )}
                  <Badge
                    variant={
                      rev.status === "approved"
                        ? "success"
                        : rev.status === "rejected"
                        ? "destructive"
                        : "warning"
                    }
                    className="text-[10px] uppercase font-bold"
                  >
                    {rev.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-3 text-xs">
                {rev.headline && (
                  <h4 className="font-bold text-sm text-foreground">
                    "{rev.headline}"
                  </h4>
                )}
                <p className="text-muted-foreground leading-relaxed">
                  {rev.comment}
                </p>

                {/* Attached customer photos */}
                {Array.isArray(rev.mediaUrls) && rev.mediaUrls.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    {rev.mediaUrls.map((m: any, idx: number) => (
                      <a
                        key={idx}
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 rounded-lg overflow-hidden border border-border"
                      >
                        <img
                          src={m.url}
                          alt="Preuve photo"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {/* Moderation Actions */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending || rev.status === "rejected"}
                    onClick={() => handleModerate(rev.id, "rejected")}
                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Rejeter
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    disabled={isPending || rev.status === "approved"}
                    onClick={() => handleModerate(rev.id, "approved")}
                    className="h-8 text-xs font-bold"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Approuver & Publier
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
