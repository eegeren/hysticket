"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../../lib/api";
import type { Category, Impact, Device, Store } from "../../../../lib/types";

const categories: { value: Category; label: string }[] = [
  { value: "INTERNET_WAN", label: "İnternet / WAN" },
  { value: "LAN_WIFI", label: "LAN / Wi-Fi" },
  { value: "PRINTER_BARCODE", label: "Yazıcı / Barkod" },
  { value: "PC_TABLET", label: "PC / Tablet" },
  { value: "ACCOUNT_ACCESS", label: "Hesap Erişimi" },
  { value: "APP_SERVER", label: "Uygulama / Sunucu" },
  { value: "OTHER", label: "Diğer" },
];

const impacts: { value: Impact; label: string; hint: string }[] = [
  { value: "SALES_STOPPED", label: "Satış durdu (P1)", hint: "P1 öncelik, anında müdahale" },
  { value: "PARTIAL", label: "Kısmi etki (P2)", hint: "P2 öncelik, aynı gün çözüm" },
  { value: "INFO", label: "Bilgi (P3)", hint: "P3 öncelik, önceliklendirilir" },
];

const inputClasses =
  "w-full rounded-xl bg-slate-900/80 border border-slate-800/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 transition disabled:opacity-60 disabled:cursor-not-allowed";

const labelClasses = "text-sm font-medium text-slate-200 mb-1 flex items-center justify-between";

export default function NewTicket() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("INTERNET_WAN");
  const [impact, setImpact] = useState<Impact>("PARTIAL");
  const [requesterName, setRequesterName] = useState("");
  const [storeId, setStoreId] = useState("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    apiFetch<Store[]>("/admin/stores").then(setStores).catch(() => setStores([]));
  }, []);

  useEffect(() => {
    if (!storeId) {
      setDevices([]);
      return;
    }
    apiFetch<Device[]>(`/stores/${storeId}/devices`).then(setDevices).catch(() => setDevices([]));
  }, [storeId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/tickets", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category,
          impact,
          store_id: storeId,
          requester_name: requesterName,
          device_id: deviceId || null,
        }),
      });
      router.push("/store/tickets");
    } catch (err: any) {
      setError(err.message || "Kaydedilemedi");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(94,234,212,0.08),transparent_30%),linear-gradient(120deg,rgba(59,130,246,0.05),rgba(14,165,233,0.04),rgba(94,234,212,0.05))]" />
      <div className="relative max-w-6xl mx-auto px-4 py-12">
        <section className="rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 shadow-2xl shadow-primary/10 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-slate-800/70">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.12em] text-accent">Ticket Formu</p>
              <p className="text-sm text-slate-300">Mağaza, cihaz ve etkiyi girerek bileti açın.</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5 p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>
                  Ad Soyad <span className="text-xs text-slate-400 font-normal">zorunlu</span>
                </label>
                <input className={inputClasses} value={requesterName} onChange={(e) => setRequesterName(e.target.value)} placeholder="Adınız Soyadınız" required />
              </div>
              <div>
                <label className={labelClasses}>
                  Mağaza <span className="text-xs text-slate-400 font-normal">zorunlu</span>
                </label>
                <select className={inputClasses} value={storeId} onChange={(e) => setStoreId(e.target.value)} required>
                  <option value="">Mağaza seçin</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>
                  Cihaz <span className="text-xs text-slate-400 font-normal">opsiyonel</span>
                </label>
                <select className={inputClasses} value={deviceId} onChange={(e) => setDeviceId(e.target.value)} disabled={!storeId}>
                  <option value="">Cihaz seç</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label} ({d.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses}>Kategori</label>
                <select className={inputClasses} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Başlık</label>
                <input className={inputClasses} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kısa ve anlaşılır başlık" required />
              </div>
              <div>
                <label className={labelClasses}>Etki seviyesi</label>
                <select className={inputClasses} value={impact} onChange={(e) => setImpact(e.target.value as Impact)}>
                  {impacts.map((i) => (
                    <option key={i.value} value={i.value}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClasses}>Açıklama</label>
              <textarea
                className={`${inputClasses} resize-none`}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adımlar, ekran görüntüsü bilgisi, cihazda gözlenen davranış..."
                required
              />
            </div>

            {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed" type="submit" disabled={!storeId}>
                Ticket Oluştur
              </button>
              <span className="text-xs text-slate-400">Kaydetmeden önce bilgileri kontrol edin.</span>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
