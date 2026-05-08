"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAdminSecret } from "@/lib/auth";
import { STORES } from "@/lib/stores";

type Status = "OPEN" | "IN_PROGRESS" | "WAITING_STORE" | "RESOLVED" | "CLOSED";
type Priority = "P1" | "P2" | "P3" | "P4";

type Ticket = {
  id: string;
  store_id: string;
  title: string;
  category: string;
  impact: string;
  priority: Priority;
  status: Status;
  created_at?: string;
};

const statusLabels: Record<Status, string> = {
  OPEN: "Açık",
  IN_PROGRESS: "Kabul edildi",
  WAITING_STORE: "Mağaza beklemede",
  RESOLVED: "Çözüldü",
  CLOSED: "Kapalı",
};

const statusColors: Record<Status, string> = {
  OPEN: "bg-red-500/15 text-red-300 border-red-500/30",
  IN_PROGRESS: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  WAITING_STORE: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  RESOLVED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  CLOSED: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const priorityColors: Record<Priority, string> = {
  P1: "bg-red-500/20 text-red-200 border-red-400/40",
  P2: "bg-orange-500/15 text-orange-300 border-orange-400/30",
  P3: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  P4: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const statuses: { value: Status; label: string }[] = [
  { value: "OPEN", label: "Açık" },
  { value: "IN_PROGRESS", label: "Kabul edildi" },
  { value: "WAITING_STORE", label: "Mağaza beklemede" },
  { value: "RESOLVED", label: "Çözüldü" },
  { value: "CLOSED", label: "Kapalı" },
];

const priorities: { value: Priority; label: string }[] = [
  { value: "P1", label: "P1 – Kritik" },
  { value: "P2", label: "P2 – Yüksek" },
  { value: "P3", label: "P3 – Normal" },
  { value: "P4", label: "P4 – Düşük" },
];

const categories = [
  { value: "INTERNET_WAN", label: "İnternet / WAN" },
  { value: "LAN_WIFI", label: "LAN / Wi-Fi" },
  { value: "POS", label: "POS" },
  { value: "PRINTER_BARCODE", label: "Yazıcı / Barkod" },
  { value: "PC_TABLET", label: "PC / Tablet" },
  { value: "ACCOUNT_ACCESS", label: "Hesap Erişimi" },
  { value: "APP_SERVER", label: "Uygulama / Sunucu" },
  { value: "OTHER", label: "Diğer" },
];

const selectCls =
  "bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-accent transition";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.detail || data?.error || `HTTP ${res.status}`);
  return data as T;
}

export default function AdminTicketsListPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [query, setQuery] = useState("");

  const load = async (
    sf = statusFilter,
    pf = priorityFilter,
    stf = storeFilter,
    cf = categoryFilter,
    q = query
  ) => {
    const token = getAdminSecret();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sf) params.set("status", sf);
      if (pf) params.set("priority", pf);
      if (stf) params.set("store_id", stf);
      if (cf) params.set("category", cf);
      if (q.trim()) params.set("q", q.trim());
      const qs = params.toString() ? `?${params}` : "";
      const data = await fetchJson<Ticket[]>(`/api/admin/tickets${qs}`, {
        headers: { "X-Admin-Password": token },
        cache: "no-store",
      });
      setTickets(data);
    } catch (e: any) {
      setError(e?.message ?? "Liste alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = () => load(statusFilter, priorityFilter, storeFilter, categoryFilter, query);

  const handleReset = () => {
    setStatusFilter("");
    setPriorityFilter("");
    setStoreFilter("");
    setCategoryFilter("");
    setQuery("");
    load("", "", "", "", "");
  };

  if (error) {
    return (
      <div className="p-6 space-y-3">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">{error}</div>
        <Link className="rounded-lg border border-slate-700 px-3 py-2 text-sm inline-block text-slate-200" href="/admin/login">
          Giriş ekranına git
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Admin Ticketları</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {loading ? "Yükleniyor..." : `${tickets.length} kayıt`}
          </p>
        </div>
        <Link
          href="/admin/reports"
          className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700/60 transition"
          style={{ textDecoration: "none" }}
        >
          Raporlar
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Durum</span>
          <select className={selectCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Hepsi</option>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Öncelik</span>
          <select className={selectCls} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">Hepsi</option>
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Mağaza</span>
          <select className={selectCls} value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
            <option value="">Hepsi</option>
            {STORES.map((s) => (
              <option key={s.id} value={s.id}>{s.id} — {s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-400">Kategori</span>
          <select className={selectCls} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Hepsi</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 min-w-[220px]">
          <span className="text-xs text-slate-400">Arama</span>
          <input
            className={selectCls}
            placeholder="Ticket ID, başlık, açıklama, cihaz..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleFilter();
            }}
          />
        </div>
        <button className="btn btn-primary text-sm h-9 px-4" onClick={handleFilter}>Filtrele</button>
        {(statusFilter || priorityFilter || storeFilter || categoryFilter || query.trim()) && (
          <button className="btn btn-secondary text-sm h-9 px-4" onClick={handleReset}>Temizle</button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur">
        <div className="grid grid-cols-[2fr,1.8fr,1fr,1fr,1.4fr] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 border-b border-slate-800">
          <div>Başlık / Mağaza</div>
          <div>Başlık</div>
          <div>Durum</div>
          <div>Öncelik</div>
          <div>Oluşturma</div>
        </div>
        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">Yükleniyor...</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {tickets.map((t) => {
              const store = STORES.find((s) => s.id === t.store_id);
              return (
                <Link
                  key={t.id}
                  href={`/admin/tickets/${t.id}`}
                  className="grid grid-cols-[2fr,1.8fr,1fr,1fr,1.4fr] px-4 py-3 text-sm transition hover:bg-slate-800/50"
                  style={{ textDecoration: "none" }}
                >
                  <span className="text-slate-200 font-medium truncate pr-2">
                    {store ? store.name : t.store_id}
                    <span className="ml-1 text-xs text-slate-500 font-normal">({t.store_id})</span>
                  </span>
                  <span className="text-slate-300 truncate pr-2">{t.title}</span>
                  <span>
                    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium ${statusColors[t.status] ?? "bg-slate-700 text-slate-300"}`}>
                      {statusLabels[t.status] ?? t.status}
                    </span>
                  </span>
                  <span>
                    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-bold ${priorityColors[t.priority] ?? "bg-slate-700 text-slate-300"}`}>
                      {t.priority}
                    </span>
                  </span>
                  <span className="text-slate-400 text-xs">
                    {t.created_at ? new Date(t.created_at).toLocaleString("tr-TR") : "-"}
                  </span>
                </Link>
              );
            })}
            {tickets.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                Kayıt bulunamadı.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
