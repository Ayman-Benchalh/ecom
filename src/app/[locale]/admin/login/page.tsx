"use client";

import React, { useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { loginAdminAction } from "@/features/auth/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, ShieldAlert, Loader2, KeyRound } from "lucide-react";

export default function AdminLoginPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const router = useRouter();

  const [email, setEmail] = useState("admin@rayana.ma");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await loginAdminAction({ email, password });
      if (res.success) {
        router.push(`/${locale}/admin`);
      } else {
        setErrorMsg(res.error || "Identifiants invalides.");
      }
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-2xl mx-auto shadow-md">
            R
          </div>
          <h1 className="text-2xl font-black text-foreground font-serif tracking-tight">
            RAYANA Administration
          </h1>
          <p className="text-xs text-muted-foreground">
            Espace d'administration sécurisé
          </p>
        </div>

        <Card className="border border-border shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              Connexion administrateur
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Adresse e-mail
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@rayana.ma"
                    className="pl-10"
                  />
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-10"
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 text-sm font-bold cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Vérification en cours...
                  </>
                ) : (
                  "Se Connecter"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-[11px] text-center text-muted-foreground">
          Identifiants initiaux : admin@rayana.ma / RayanaAdmin2026!Secure
        </p>
      </div>
    </div>
  );
}

