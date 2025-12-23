"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { setToken } from "../../../lib/auth";

export default function StoreLogin() {
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { token } = await apiFetch<{ token: string }>("/auth/store/login", {
        method: "POST",
        body: JSON.stringify({ code, pin }),
      });
      setToken(token);
      router.push("/store/tickets");
    } catch (err: any) {
      setError(err.message || "Giriş başarısız");
    }
  };

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-2xl font-semibold mb-4">Mağaza Girişi</h1>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Store Code</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">PIN</label>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} required />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button className="btn-primary w-full" type="submit">
          Giriş Yap
        </button>
      </form>
    </div>
  );
}
