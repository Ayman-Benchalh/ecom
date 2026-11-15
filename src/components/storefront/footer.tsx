import Link from "next/link";
import { getDictionary, isRTL } from "@/lib/i18n";
import { ShieldCheck, Truck, RotateCcw, Phone, MapPin } from "lucide-react";

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  const dict = getDictionary(locale);
  const rtl = isRTL(locale);

  return (
    <footer className="w-full bg-surface-container border-t border-border mt-auto pt-12 pb-8 text-foreground transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Moroccan Trust Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-10 border-b border-border/80">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border/60 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">
                {dict.storefront.freeDelivery}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dict.storefront.estimatedDelivery}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border/60 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">
                {dict.storefront.cashOnDelivery}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Paiement en espèces à la livraison
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border/60 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">
                {dict.storefront.guaranteeDays}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Échange de taille facile & rapide
              </p>
            </div>
          </div>
        </div>

        {/* Links & Brand */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10 border-b border-border/80 text-sm">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight font-serif">
                RAYANA
              </span>
            </div>
            <p className="text-muted-foreground text-xs max-w-sm leading-relaxed">
              {dict.brand.tagline}. Des confections de haute qualité, pensées et
              taillées pour votre confort au quotidien. Vente directe sans
              intermédiaire.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Casablanca, Royaume du Maroc</span>
            </div>
          </div>

          <div>
            <h5 className="font-bold text-xs uppercase tracking-wider text-foreground mb-3">
              Service Client
            </h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}/order/track`}
                  className="hover:text-primary transition-colors"
                >
                  {dict.nav.tracking}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/returns`}
                  className="hover:text-primary transition-colors"
                >
                  {dict.nav.returns}
                </Link>
              </li>
              <li className="flex items-center gap-1.5 pt-1">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-foreground">
                  +212 6 12 34 56 78
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-xs uppercase tracking-wider text-foreground mb-3">
              Espace Professionnel
            </h5>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}/admin`}
                  className="hover:text-primary transition-colors"
                >
                  {dict.nav.admin}
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/80">
                  © 2026 RAYANA SARL. Tous droits réservés.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-3">
          <p>
            RAYANA — Plateforme e-commerce optimisée pour le marché marocain.
          </p>
          <div className="flex items-center gap-4">
            <span>Paiement à la livraison 100% sécurisé</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
