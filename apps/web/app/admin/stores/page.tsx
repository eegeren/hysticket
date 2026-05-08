"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";
import type { Store } from "../../../lib/types";

export default function AdminStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [form, setForm] = useState({ name: "", code: "", pin: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await apiFetch<Store[]>("/admin/stores");
      setStores(data);
    } catch (err: any) {
      setError(err.message || "Liste alınamadı");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await apiFetch("/admin/stores", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ name: "", code: "", pin: "" });
      load();
    } catch (err: any) {
      setError(err.message || "Oluşturulamadı");
    }
  };

  const resetPin = async (id: string) => {
    const resp = await apiFetch<{ pin: string }>(`/admin/stores/${id}/reset-pin`, { method: "POST" });
    setMessage(`Yeni PIN: ${resp.pin}`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mağazalar</h1>
      {message && <div className="text-green-400 text-sm">{message}</div>}
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="card space-y-3">
        <h2 className="font-semibold">Yeni Mağaza</h2>
        <form className="grid md:grid-cols-4 gap-3" onSubmit={createStore}>
          <input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <input placeholder="Code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required />
          <input placeholder="PIN" value={form.pin} onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))} required />
          <button className="btn-primary" type="submit">
            Kaydet
          </button>
        </form>
      </div>
      <div className="card space-y-3">
        <h2 className="font-semibold">Liste</h2>
        <div className="grid gap-3">
          {stores.map((s) => (
            <div key={s.id} className="border border-slate-800 rounded-lg p-4 flex justify-between items-center">
              <div>
                <div className="font-semibold">{s.name}</div>
                <div className="text-sm text-slate-400">{s.code}</div>
                <div className="text-xs text-slate-500">Durum: {s.is_active ? "Aktif" : "Pasif"}</div>
              </div>
              <div className="flex gap-2 items-center text-sm">
                <Link className="btn-secondary" href={`/admin/stores/${s.id}/devices`}>
                  Cihazlar
                </Link>
                <button className="btn-secondary" onClick={() => resetPin(s.id)} type="button">
                  PIN Sıfırla
                </button>
              </div>
            </div>
          ))}
          {stores.length === 0 && <div className="text-slate-500">Kayıt yok</div>}
        </div>
      </div>
    </div>
  );
}
