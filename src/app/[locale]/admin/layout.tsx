import React from "react";
import { getAdminSession } from "@/lib/security/session";
import { AdminNav } from "./admin-nav";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();

  // If unauthenticated, allow only admin/login
  // Since Next.js server components can't directly check the full sub-path from layout easily without headers,
  // we can inspect cookies or let child pages protect themselves, or check headers.
  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen">
      {/* Admin Header */}
      <div className="h-16 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin`}
            className="flex items-center gap-2 font-black text-lg text-foreground font-serif tracking-tight"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              R
            </div>
            <span>RAYANA ADMIN</span>
          </Link>
          <span className="hidden sm:inline text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-surface-container font-mono">
            v1.0 • Maroc
          </span>
        </div>

        {session && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Connecté : <strong className="text-foreground">{session.email}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex">
        {session && <AdminNav locale={locale} adminName={session.name} />}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
