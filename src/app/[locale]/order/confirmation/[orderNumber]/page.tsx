import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderByNumber } from "@/features/orders/order-service";
import { formatMAD, getDictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  PhoneCall,
  Truck,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  MessageCircle,
} from "lucide-react";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  const dict = getDictionary(locale);

  const order = await getOrderByNumber(orderNumber);
  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Success Hero */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-serif">
          {dict.storefront.orderSuccess}
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {dict.storefront.orderSuccessMessage}
        </p>
      </div>

      {/* Confirmation Call Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3.5 text-amber-900 dark:text-amber-200 text-xs">
        <PhoneCall className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold">Important — Appel de confirmation :</strong>
          <p className="leading-relaxed">
            Un membre de l'équipe RAYANA va vous joindre au <strong>{order.customerPhone}</strong> dans les prochaines heures pour valider votre adresse exacte et planifier l'envoi du colis. Gardez votre téléphone à portée de main !
          </p>
        </div>
      </div>

      {/* WhatsApp Immediate Confirmation Button */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">
              Accélérez votre livraison via WhatsApp
            </h4>
            <p className="text-xs text-muted-foreground">
              Confirmez directement votre adresse à notre équipe pour un départ express
            </p>
          </div>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full sm:w-auto text-xs shrink-0 shadow-md">
          <a
            href={`https://wa.me/212612345678?text=${encodeURIComponent(
              `Salam RAYANA, je confirme ma commande ${order.orderNumber} (${order.offerTitle}) pour livraison à ${order.customerCity}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Confirmer sur WhatsApp
          </a>
        </Button>
      </div>

      {/* Order Details Card */}
      <Card className="border-2 border-border shadow-md overflow-hidden">
        <CardHeader className="bg-surface-container py-4 px-6 border-b border-border/60 flex flex-row items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Numéro de commande</span>
            <div className="text-lg font-black tracking-wider text-primary font-mono">
              {order.orderNumber}
            </div>
          </div>
          <Badge variant="success" className="text-xs font-bold px-3 py-1">
            Commande Reçue
          </Badge>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Customer & Shipping Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-border/60 text-xs">
            <div>
              <span className="text-muted-foreground">Client :</span>
              <div className="font-bold text-foreground text-sm mt-0.5">
                {order.customerName}
              </div>
              <div className="text-muted-foreground">{order.customerPhone}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Destination de livraison :</span>
              <div className="font-bold text-foreground text-sm mt-0.5">
                {order.customerCity}
              </div>
              {order.customerAddress && (
                <div className="text-muted-foreground">{order.customerAddress}</div>
              )}
            </div>
          </div>

          {/* Selected Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Articles commandés : {order.offerTitle} (x{order.quantity})
            </h4>

            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-border/60 text-xs"
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
                        Variante choisie :{" "}
                        <span className="font-semibold text-foreground">
                          {item.variantTitle}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="font-semibold text-muted-foreground">
                    Inclus
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total & Payment Method */}
          <div className="pt-4 border-t border-border/60 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sous-total</span>
              <span>{formatMAD(order.subtotalAmount, locale)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Livraison</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {Number(order.shippingFee) === 0 ? "GRATUITE" : formatMAD(order.shippingFee, locale)}
              </span>
            </div>
            <div className="pt-2 border-t border-border flex justify-between items-baseline font-black text-foreground">
              <span className="text-sm">Total à payer à la livraison (COD) :</span>
              <span className="text-2xl text-primary font-mono">
                {formatMAD(order.totalAmount, locale)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={`/${locale}/order/track`}>
            Suivre l'avancement de ma commande
          </Link>
        </Button>
        <Button asChild variant="default" className="w-full sm:w-auto">
          <Link href={`/${locale}`}>
            Retour à l'accueil
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
