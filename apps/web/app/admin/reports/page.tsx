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
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Raporlar</h1>
        <p className="text-sm text-slate-400">Salt okunur admin raporlama</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow">
          <div className="text-xs text-slate-400 uppercase">Toplam Ticket</div>
          <div className="text-3xl font-semibold text-slate-100">{overview.totalTickets}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow">
          <div className="text-xs text-slate-400 uppercase">Top Mağazalar</div>
          <ol className="mt-2 space-y-1 text-sm text-slate-200">
            {overview.topStores.map((s) => (
              <li key={s.store_id} className="flex justify-between">
                <span>{s.store_id}</span>
                <span className="text-slate-300">{s.count}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow">
          <div className="text-xs text-slate-400 uppercase">Top Kategoriler</div>
          <ol className="mt-2 space-y-1 text-sm text-slate-200">
            {overview.topCategories.map((c) => (
              <li key={c.category} className="flex justify-between">
                <span>{c.category}</span>
                <span className="text-slate-300">{c.count}</span>
              </li>
            ))}
          </ol>
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
          <table className="min-w-full text-sm text-slate-200">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.06em] text-slate-400">
                <th className="py-2 pr-4">Gün</th>
                <th className="py-2 pr-4">Adet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {timeline.timeline.map((row, idx) => (
                <tr key={row.day} className={idx % 2 ? "bg-slate-900/40" : ""}>
                  <td className="py-2 pr-4">{row.day}</td>
                  <td className="py-2 pr-4 text-slate-100 font-semibold">{row.count}</td>
                </tr>
              ))}
              {timeline.timeline.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-3 text-slate-400">
                    Veri yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
