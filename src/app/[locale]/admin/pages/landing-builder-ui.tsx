"use client";

import React, { useState, useTransition } from "react";
import {
  saveLandingPageVersionAction,
  duplicateLandingPageAction,
} from "@/features/pages/admin-landing-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileCode,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye,
  Copy,
  Upload,
  CheckCircle2,
  Loader2,
  Palette,
  ExternalLink,
} from "lucide-react";

export interface LandingPageData {
  id: string;
  title: string;
  slug: string;
  status: string;
  activeVersionNumber: number;
  publishedAt: string | null;
  sections: Array<{
    id?: string;
    type: string;
    title?: string;
    text?: string;
    subtitle?: string;
    items?: string[];
    hidden?: boolean;
  }>;
  appearance: {
    primaryColor?: string;
    accentColor?: string;
    borderRadius?: string;
  };
}

export function LandingBuilderUI({
  initialPages,
  locale,
}: {
  initialPages: LandingPageData[];
  locale: string;
}) {
  const [pages, setPages] = useState(initialPages);
  const [activePageId, setActivePageId] = useState(initialPages[0]?.id || "");
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  const [sections, setSections] = useState<any[]>(activePage?.sections || []);
  const [appearance, setAppearance] = useState(activePage?.appearance || {});
  const [isPending, startTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSelectPage = (page: LandingPageData) => {
    setActivePageId(page.id);
    setSections(page.sections);
    setAppearance(page.appearance);
    setSaveMessage(null);
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;
    setSections(newSections);
  };

  const handleToggleHide = (index: number) => {
    const newSections = [...sections];
    newSections[index] = {
      ...newSections[index],
      hidden: !newSections[index].hidden,
    };
    setSections(newSections);
  };

  const handleSave = (publishNow: boolean) => {
    if (!activePage) return;
    setSaveMessage(null);

    startTransition(async () => {
      const res = await saveLandingPageVersionAction({
        landingPageId: activePage.id,
        sections,
        appearance,
        publishNow,
      });

      if (res.success) {
        setSaveMessage(
          publishNow
            ? `Version ${res.versionNumber} publiée en ligne avec succès !`
            : `Brouillon version ${res.versionNumber} enregistré.`
        );
      }
    });
  };

  const handleDuplicate = () => {
    if (!activePage) return;

    startTransition(async () => {
      const res = await duplicateLandingPageAction(activePage.id);
      if (res.success) {
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Page Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={activePageId}
            onChange={(e) => {
              const p = pages.find((item) => item.id === e.target.value);
              if (p) handleSelectPage(p);
            }}
            className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-bold text-foreground"
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} (v{p.activeVersionNumber} — {p.status})
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            onClick={handleDuplicate}
            disabled={isPending}
            className="text-xs"
          >
            <Copy className="w-3.5 h-3.5 mr-1" />
            Dupliquer
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={isPending}
            className="text-xs"
          >
            Enregistrer Brouillon
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => handleSave(true)}
            disabled={isPending}
            className="text-xs font-bold"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
            Publier en Ligne
          </Button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Section Builder */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">
              Sections de la Page ({sections.length})
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Glissez ou utilisez les flèches pour réordonner
            </span>
          </div>

          <div className="space-y-3">
            {sections.map((sec, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border bg-card shadow-2xs space-y-3 transition-all ${
                  sec.hidden ? "opacity-50 border-dashed" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs uppercase tracking-wide text-foreground">
                      {sec.type.replace(/_/g, " ")}
                    </span>
                    {sec.hidden && (
                      <Badge variant="outline" className="text-[10px]">
                        Masquée
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSection(idx, "up")}
                      className="p-1.5 rounded-lg hover:bg-surface-container text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMoveSection(idx, "down")}
                      className="p-1.5 rounded-lg hover:bg-surface-container text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleHide(idx)}
                      className="p-1.5 rounded-lg hover:bg-surface-container text-muted-foreground hover:text-foreground cursor-pointer text-xs"
                    >
                      {sec.hidden ? "Afficher" : "Masquer"}
                    </button>
                  </div>
                </div>

                {/* Section Specific Inputs */}
                {sec.type === "announcement" && (
                  <div className="space-y-1">
                    <Label className="text-[11px]">Texte bandeau d'annonce :</Label>
                    <Input
                      value={sec.text || ""}
                      onChange={(e) => {
                        const copy = [...sections];
                        copy[idx].text = e.target.value;
                        setSections(copy);
                      }}
                      className="text-xs"
                    />
                  </div>
                )}

                {sec.type === "hero" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Titre d'accroche :</Label>
                      <Input
                        value={sec.title || ""}
                        onChange={(e) => {
                          const copy = [...sections];
                          copy[idx].title = e.target.value;
                          setSections(copy);
                        }}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Sous-titre :</Label>
                      <Input
                        value={sec.subtitle || ""}
                        onChange={(e) => {
                          const copy = [...sections];
                          copy[idx].subtitle = e.target.value;
                          setSections(copy);
                        }}
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Design & Appearance Tokens */}
        <div className="space-y-4">
          <Card className="border border-border shadow-xs">
            <CardHeader className="py-4 px-5 border-b border-border/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                Jetons de Design & Apparence
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label>Couleur Primaire (Marque) :</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={appearance.primaryColor || "#0F4C3A"}
                    onChange={(e) =>
                      setAppearance({ ...appearance, primaryColor: e.target.value })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border border-border"
                  />
                  <Input
                    value={appearance.primaryColor || "#0F4C3A"}
                    onChange={(e) =>
                      setAppearance({ ...appearance, primaryColor: e.target.value })
                    }
                    className="font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Couleur d'Accent :</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={appearance.accentColor || "#B25E29"}
                    onChange={(e) =>
                      setAppearance({ ...appearance, accentColor: e.target.value })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border border-border"
                  />
                  <Input
                    value={appearance.accentColor || "#B25E29"}
                    onChange={(e) =>
                      setAppearance({ ...appearance, accentColor: e.target.value })
                    }
                    className="font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Rayon des bordures (Arrondi) :</Label>
                <select
                  value={appearance.borderRadius || "rounded-xl"}
                  onChange={(e) =>
                    setAppearance({ ...appearance, borderRadius: e.target.value })
                  }
                  className="w-full h-10 rounded-xl border border-input bg-card px-3 text-xs"
                >
                  <option value="rounded-md">Subtil (6px)</option>
                  <option value="rounded-xl">Standard M3 (12px)</option>
                  <option value="rounded-2xl">Moderne Arrondi (16px)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-border">
                <Button
                  asChild
                  variant="outline"
                  className="w-full text-xs font-semibold"
                >
                  <a href={`/${locale}`} target="_blank" rel="noopener noreferrer">
                    Prévisualiser la Page en Direct
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
