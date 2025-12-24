"use client";

import { useEffect, useState } from "react";
import { getAdminSecret } from "@/lib/auth";

type Overview = { totalTickets: number; topStores: { store_id: string; count: number }[]; topCategories: { category: string; count: number }[] };
type StoreCategory = { store_id: string; category: string; count: number }[];
type Timeline = { days: number; timeline: { day: string; count: number }[] };

export default function AdminReportsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [storeCats, setStoreCats] = useState<StoreCategory>([]);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const downloadCsv = () => {
    if (!overview || !timeline) return;
    const lines: string[] = [];
    lines.push("=== Toplam ===");
    lines.push(`Toplam Ticket;${overview.totalTickets}`);
    lines.push("");
    lines.push("=== Top Mağazalar ===");
    lines.push("Mağaza;Adet");
    overview.topStores.forEach((s) => lines.push(`${s.store_id};${s.count}`));
    lines.push("");
    lines.push("=== Top Kategoriler ===");
    lines.push("Kategori;Adet");
    overview.topCategories.forEach((c) => lines.push(`${c.category};${c.count}`));
    lines.push("");
    lines.push("=== Store x Category (Top 30) ===");
    lines.push("Mağaza;Kategori;Adet");
    storeCats.slice(0, 30).forEach((r) => lines.push(`${r.store_id};${r.category};${r.count}`));
    lines.push("");
    lines.push("=== Timeline ===");
    lines.push("Gün;Adet");
    timeline.timeline.forEach((t) => lines.push(`${t.day};${t.count}`));

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapor-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const token = getAdminSecret();
    if (!token) {
      window.location.href = "/admin/login?next=/admin/reports";
      return;
    }

    const fetchWithAuth = async <T,>(url: string): Promise<T> => {
      const res = await fetch(url, { headers: { "X-Admin-Password": token }, cache: "no-store" });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return text ? (JSON.parse(text) as T) : (null as unknown as T);
    };

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [ov, sc, tl] = await Promise.all([
          fetchWithAuth<Overview>("/api/admin/reports/overview"),
          fetchWithAuth<StoreCategory>("/api/admin/reports/store-category"),
          fetchWithAuth<Timeline>("/api/admin/reports/timeline"),
        ]);
        setOverview(ov);
        setStoreCats(sc);
        setTimeline(tl);
      } catch (e: any) {
        setError(e?.message ?? "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6 text-slate-200">Yükleniyor...</div>;
  if (error) return <div className="p-6 text-red-300">Hata: {error}</div>;
  if (!overview || !timeline) return <div className="p-6 text-slate-200">Veri bulunamadı.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Raporlar</h1>
          <p className="text-sm text-slate-400">Salt okunur admin raporlama</p>
        </div>
        <button
          onClick={downloadCsv}
          className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700/60 transition"
        >
          Raporu indir (CSV)
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow">
          <div className="text-xs text-slate-400 uppercase">Toplam Ticket</div>
          <div className="text-3xl font-semibold text-slate-100">{overview.totalTickets}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow">
          <div className="text-xs text-slate-400 uppercase">Top Mağazalar</div>
          <div className="mt-3 space-y-2">
            {overview.topStores.map((s) => {
              const max = overview.topStores[0]?.count || 1;
              const width = Math.max(10, Math.round((s.count / max) * 100));
              return (
                <div key={s.store_id}>
                  <div className="flex justify-between text-sm text-slate-200">
                    <span>{s.store_id}</span>
                    <span className="text-slate-300">{s.count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-slate-800">
                    <div className="h-2 rounded bg-sky-500/80" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow">
          <div className="text-xs text-slate-400 uppercase">Top Kategoriler</div>
          <div className="mt-3 space-y-2">
            {overview.topCategories.map((c) => {
              const max = overview.topCategories[0]?.count || 1;
              const width = Math.max(10, Math.round((c.count / max) * 100));
              return (
                <div key={c.category}>
                  <div className="flex justify-between text-sm text-slate-200">
                    <span>{c.category}</span>
                    <span className="text-slate-300">{c.count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-slate-800">
                    <div className="h-2 rounded bg-emerald-500/80" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Store × Kategori (Top 30)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-200">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.06em] text-slate-400">
                <th className="py-2 pr-4">Mağaza</th>
                <th className="py-2 pr-4">Kategori</th>
                <th className="py-2 pr-4">Adet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {storeCats.slice(0, 30).map((row, idx) => (
                <tr key={`${row.store_id}-${row.category}-${idx}`} className={idx % 2 ? "bg-slate-900/40" : ""}>
                  <td className="py-2 pr-4">{row.store_id}</td>
                  <td className="py-2 pr-4">{row.category}</td>
                  <td className="py-2 pr-4 text-slate-100 font-semibold">{row.count}</td>
                </tr>
              ))}
              {storeCats.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-3 text-slate-400">
                    Veri yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Son {timeline.days} Gün Timeline</h2>
        </div>
        <div className="overflow-x-auto">
          <div className="space-y-2 min-w-[260px]">
            {timeline.timeline.map((row, idx) => {
              const max = Math.max(...timeline.timeline.map((t) => t.count), 1);
              const width = Math.max(8, Math.round((row.count / max) * 100));
              return (
                <div key={row.day} className={`rounded-lg border border-slate-800 px-3 py-2 ${idx % 2 ? "bg-slate-900/40" : "bg-slate-900/20"}`}>
                  <div className="flex justify-between text-sm text-slate-200">
                    <span>{row.day}</span>
                    <span className="text-slate-100 font-semibold">{row.count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-slate-800">
                    <div className="h-2 rounded bg-indigo-500/80" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
            {timeline.timeline.length === 0 && <div className="py-3 text-slate-400">Veri yok</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
