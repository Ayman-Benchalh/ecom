import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/security/session";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SettingsManager } from "./settings-manager";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  const [storeSettings] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "store_general"))
    .limit(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground font-serif tracking-tight">
          Paramètres Généraux & Sécurité
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configuration de la marque RAYANA, Meta Pixel, frais de livraison et identifiants de sécurité
        </p>
      </div>

      <SettingsManager
        initialSettings={storeSettings?.valueJson || {}}
        adminEmail={session.email}
        locale={locale}
      />
    </div>
  );
}

