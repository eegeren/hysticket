"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { setTokenCookie } from "@/lib/auth";

type AdminLoginResponse = {
  token: string;
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6 text-slate-400">Yükleniyor...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const n = searchParams?.get("next");
    // Açık redirect riskini azaltmak için sadece site içi path kabul et
    if (!n) return "/admin/tickets";
    if (!n.startsWith("/")) return "/admin/tickets";
    if (n.startsWith("//")) return "/admin/tickets";
    return n;
  }, [searchParams]);

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const p = password.trim();
    if (!p) {
      setError("Şifre gerekli.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<AdminLoginResponse>("/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({ password: p }),
      });

      // Token'ı cookie'ye yaz (client-side; MVP için yeterli)
      setTokenCookie(res.token, { role: "admin" });

      router.replace(nextPath);
    } catch (err: any) {
      const msg = err?.message || err?.data?.detail || "Giriş başarısız. Şifreyi kontrol edip tekrar deneyin.";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border bg-white/70 p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Admin Giriş</h1>
          <p className="mt-1 text-sm text-slate-600">HYS IT Ticket yönetim paneline giriş.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Şifre</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Admin şifresi"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="w-full rounded-xl border px-3 py-2 font-medium disabled:opacity-60">
              {submitting ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>

            <div className="text-xs text-slate-500">
              Sorun yaşarsan backend'in çalıştığını kontrol et: <span className="font-mono">/healthz</span>
            </div>
          </form>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
          <span className="font-mono">Admin</span> token cookie olarak saklanır (MVP).
        </div>
      </div>
    </div>
  );
}
