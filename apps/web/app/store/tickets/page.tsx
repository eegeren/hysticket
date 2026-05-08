"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Ticket, Status } from "../../../lib/types";
import { STORES } from "@/lib/stores";

const statuses: Status[] = ["OPEN", "IN_PROGRESS", "WAITING_STORE", "RESOLVED", "CLOSED"];

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

const categoryLabels: Record<string, string> = {
  INTERNET_WAN: "İnternet / WAN",
  LAN_WIFI: "LAN / Wi-Fi",
  POS: "POS",
  PRINTER_BARCODE: "Yazıcı / Barkod",
  PC_TABLET: "PC / Tablet",
  ACCOUNT_ACCESS: "Hesap Erişimi",
  APP_SERVER: "Uygulama / Sunucu",
  OTHER: "Diğer",
};

const impactLabels: Record<string, string> = {
  SALES_STOPPED: "Satış durdu",
  PARTIAL: "Kısmi etki",
  INFO: "Bilgi",
};

const priorityColors: Record<string, string> = {
  P1: "bg-red-500/20 text-red-200 border-red-400/40",
  P2: "bg-orange-500/15 text-orange-300 border-orange-400/30",
  P3: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  P4: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const selectCls =
  "bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-accent transition w-full";

export default function StoreTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState<string>("");
  const [storeId, setStoreId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setStoreSession = async (store: string) => {
    await fetch("/api/store/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: store }),
      credentials: "include",
    });
  };

  const load = async (sf = status, stf = storeId) => {
    if (!stf) { setTickets([]); return; }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (sf) params.set("status_filter", sf);
    const query = params.toString() ? `?${params}` : "";
    try {
      await setStoreSession(stf);
      const res = await fetch(`/api/store/tickets${query}`, { cache: "no-store" });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
      const data = text ? (JSON.parse(text) as Ticket[]) : [];
      setTickets(data);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(status, storeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, storeId]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Ticketlarım</h1>
          <p className="text-sm text-slate-400 mt-0.5">Mağazanızı seçip kayıtlarınızı görüntüleyin.</p>
        </div>
        <Link
          href="/store/tickets/new"
          className="btn btn-primary text-sm"
          style={{ textDecoration: "none" }}
        >
          + Yeni Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <span className="text-xs text-slate-400">Mağaza</span>
          <select className={selectCls} value={storeId} onChange={(e) => setStoreId(e.target.value)}>
            <option value="">Seçin</option>
            {STORES.map((s) => (
              <option key={s.id} value={s.id}>{s.id} — {s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <span className="text-xs text-slate-400">Durum</span>
          <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Hepsi</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
        </div>
        <button
          className="btn btn-secondary text-sm h-10 px-4"
          onClick={() => load(status, storeId)}
          disabled={!storeId || loading}
        >
          {loading ? "Yükleniyor..." : "Listele"}
        </button>
      </div>

      {!storeId && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-500">
          Önce mağaza seçin.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">{error}</div>
      )}

      {/* Ticket cards */}
      {storeId && !loading && (
        <div className="grid gap-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/store/tickets/${t.id}?store_id=${storeId}`}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-600 hover:bg-slate-800/60 transition-all block"
              style={{ textDecoration: "none" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium text-slate-100 leading-snug">{t.title}</div>
                <span className={`flex-shrink-0 inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${statusColors[t.status] ?? "bg-slate-700 text-slate-300"}`}>
                  {statusLabels[t.status] ?? t.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                <span>{new Date(t.created_at).toLocaleString("tr-TR")}</span>
                <span>·</span>
                <span>{categoryLabels[t.category] || t.category}</span>
                <span>·</span>
                <span>Etki: {impactLabels[t.impact] || t.impact}</span>
                <span>·</span>
                <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-bold text-[11px] ${priorityColors[t.priority] ?? ""}`}>
                  {t.priority}
                </span>
              </div>
            </Link>
          ))}
          {tickets.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-500">
              Bu mağazaya ait kayıt bulunamadı.
            </div>
          )}
        </div>
      )}

      {storeId && loading && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-500">
          Yükleniyor...
        </div>
      )}
    </div>
  );
}
