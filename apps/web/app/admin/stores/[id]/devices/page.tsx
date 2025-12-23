"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../../lib/api";
import type { Device } from "../../../../../lib/types";

export default function StoreDevices() {
  const params = useParams<{ id: string }>();
  const storeId = params?.id;
  const [devices, setDevices] = useState<Device[]>([]);
  const [form, setForm] = useState({ label: "", type: "", serial: "" });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!storeId) return;
    try {
      const data = await apiFetch<Device[]>(`/admin/stores/${storeId}/devices`);
      setDevices(data);
    } catch (err: any) {
      setError(err.message || "Yüklenemedi");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const createDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    try {
      await apiFetch(`/admin/stores/${storeId}/devices`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ label: "", type: "", serial: "" });
      load();
    } catch (err: any) {
      setError(err.message || "Oluşturulamadı");
    }
  };

  const remove = async (id: string) => {
    await apiFetch(`/admin/devices/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Cihazlar</h1>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="card space-y-3">
        <h2 className="font-semibold">Yeni Cihaz</h2>
        <form className="grid md:grid-cols-4 gap-3" onSubmit={createDevice}>
          <input placeholder="Label" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required />
          <input placeholder="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} required />
          <input placeholder="Serial" value={form.serial} onChange={(e) => setForm((f) => ({ ...f, serial: e.target.value }))} />
          <button className="btn-primary" type="submit">
            Kaydet
          </button>
        </form>
      </div>
      <div className="card space-y-3">
        <h2 className="font-semibold">Liste</h2>
        <div className="grid gap-3">
          {devices.map((d) => (
            <div key={d.id} className="border border-slate-800 rounded p-3 flex justify-between items-center">
              <div>
                <div className="font-semibold">{d.label}</div>
                <div className="text-sm text-slate-400">{d.type}</div>
                {d.serial && <div className="text-xs text-slate-500">{d.serial}</div>}
              </div>
              <button className="btn-secondary" onClick={() => remove(d.id)} type="button">
                Sil
              </button>
            </div>
          ))}
          {devices.length === 0 && <div className="text-slate-500">Kayıt yok</div>}
        </div>
      </div>
    </div>
  );
}
