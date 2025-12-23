"use client";

import { useState } from "react";
import { STORES } from "@/lib/stores";

export default function StoreLogin() {
  const [storeId, setStoreId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const resp = await fetch("/api/store/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Giriş başarısız");
      }
      window.location.href = "/store/tickets";
    } catch (err: any) {
      setError(err.message || "Giriş başarısız");
    }
  };

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-2xl font-semibold mb-4">Mağaza Girişi</h1>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Mağaza</label>
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} required>
            <option value="" disabled>
              Mağaza seç
            </option>
            {STORES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.name}
              </option>
            ))}
          </select>
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button className="btn-primary w-full" type="submit" disabled={!storeId}>
          Devam
        </button>
      </form>
    </div>
  );
}
