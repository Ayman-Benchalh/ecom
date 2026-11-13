"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAdminAction } from "@/features/auth/admin-actions";
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Package,
  FileCode,
  Star,
  RotateCcw,
  Truck,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";

interface AdminNavProps {
  locale: string;
  adminName: string;
}

export function AdminNav({ locale, adminName }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: `/${locale}/admin`, label: "Tableau de Bord", icon: LayoutDashboard },
    { href: `/${locale}/admin/orders`, label: "Commandes", icon: ShoppingBag },
    { href: `/${locale}/admin/products`, label: "Produits & Stock", icon: Package },
    { href: `/${locale}/admin/packs`, label: "Packs & Bundles", icon: Layers },
    { href: `/${locale}/admin/pages`, label: "Pages de Vente", icon: FileCode },
    { href: `/${locale}/admin/reviews`, label: "Avis Clients", icon: Star },
    { href: `/${locale}/admin/returns`, label: "Retours & SAV", icon: RotateCcw },
    { href: `/${locale}/admin/carriers`, label: "Transport & COD", icon: Truck },
    { href: `/${locale}/admin/settings`, label: "Paramètres", icon: Settings },
  ];

  const handleLogout = async () => {
    await logoutAdminAction();
    router.push(`/${locale}/admin/login`);
  };

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col justify-between p-4 hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-3 rounded-2xl bg-surface-container flex items-center justify-between">
          <div className="space-y-0.5 truncate">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Connecté en tant que
            </span>
            <div className="text-xs font-bold text-foreground truncate">
              {adminName}
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
            A
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === `/${locale}/admin`
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:bg-surface-container hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-2 pt-4 border-t border-border">
        <Link
          href={`/${locale}`}
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-muted-foreground hover:bg-surface-container hover:text-foreground transition-colors font-medium"
        >
          <span>Voir la boutique</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
