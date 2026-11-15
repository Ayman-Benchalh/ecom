import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/security/session";
import { db } from "@/lib/db";
import { landingPages, landingPageVersions } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { LandingBuilderUI, LandingPageData } from "./landing-builder-ui";

export default async function AdminPagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  const allPages = await db.select().from(landingPages).orderBy(desc(landingPages.createdAt));

  const pagesWithVersions: LandingPageData[] = await Promise.all(
    allPages.map(async (page) => {
      const [latestVersion] = await db
        .select()
        .from(landingPageVersions)
        .where(eq(landingPageVersions.landingPageId, page.id))
        .orderBy(desc(landingPageVersions.versionNumber))
        .limit(1);

      return {
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: page.status,
        activeVersionNumber: page.activeVersionNumber,
        publishedAt: page.publishedAt ? page.publishedAt.toISOString() : null,
        sections: Array.isArray(latestVersion?.sectionsJson)
          ? (latestVersion.sectionsJson as any[])
          : [],
        appearance: (latestVersion?.appearanceJson as any) || {},
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground font-serif tracking-tight">
          Éditeur de Pages de Vente
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Personnalisation visuelle structurée par sections, gestion des versions et publication
        </p>
      </div>

      <LandingBuilderUI initialPages={pagesWithVersions} locale={locale} />
    </div>
  );
}

