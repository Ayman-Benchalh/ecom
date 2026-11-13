"use client";

import React, { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
} from "lucide-react";

export default function ReviewSubmitPage() {
  const params = useParams();
  const token = params?.token as string;
  const locale = (params?.locale as string) || "fr";
  const dict = getDictionary(locale);
  const router = useRouter();

  const [rating, setRating] = useState(5);
  const [headline, setHeadline] = useState("");
  const [comment, setComment] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!comment.trim()) {
      setErrorMsg("Veuillez rédiger un commentaire sur votre expérience.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/reviews/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            rating,
            headline,
            comment,
            mediaUrls: photoUrl ? [{ url: photoUrl, type: "image" }] : [],
          }),
        });

        const data = await res.json();
        if (data.success) {
          setSubmitted(true);
        } else {
          setErrorMsg(data.error || "Erreur lors de l'enregistrement de votre avis.");
        }
      } catch (err) {
        setErrorMsg("Erreur réseau. Veuillez réessayer.");
      }
    });
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground font-serif">
          Merci pour votre retour authentique !
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {dict.reviews.reviewSuccess}
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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-4 h-4" />
          <span>Avis Client Certifié (Commande Livrée)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-serif">
          Partagez votre avis sur RAYANA
        </h1>
        <p className="text-xs text-muted-foreground">
          Votre témoignage aide les acheteurs marocains à faire le bon choix
        </p>
      </div>

      <Card className="border border-border shadow-xs">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Star Rating */}
            <div className="space-y-1.5 text-center">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Votre note globale
              </Label>
              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-hidden"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30 fill-transparent"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-1.5">
              <Label htmlFor="headline" className="text-xs">
                Titre de votre avis (Optionnel)
              </Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Ex: Coton très agréable, coupe impeccable !"
              />
            </div>

            {/* Detailed Comment */}
            <div className="space-y-1.5">
              <Label htmlFor="comment" className="text-xs">
                Votre avis détaillé <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="comment"
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Qualité du tissu, tenue au lavage, ponctualité de la livraison..."
                className="w-full rounded-xl border border-input bg-card p-3 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Photo upload / link */}
            <div className="space-y-1.5">
              <Label htmlFor="photo" className="text-xs flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-primary" />
                Photo du produit reçu (Lien optionnel)
              </Label>
              <Input
                id="photo"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://... (URL d'une photo de votre article)"
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
                  Envoi en cours...
                </>
              ) : (
                "Publier mon avis authentique"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
