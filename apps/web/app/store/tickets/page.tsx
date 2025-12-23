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
const priorityLabels: Record<string, string> = {
  P1: "Öncelik P1",
  P2: "Öncelik P2",
  P3: "Öncelik P3",
  P4: "Öncelik P4",
};

export default function StoreTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState<string>("");
  const [storeId, setStoreId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!storeId) {
      setTickets([]);
      return;
    }
    setError(null);
    const params = new URLSearchParams();
    if (status) params.set("status_filter", status);
    params.set("store_id", storeId);
    const query = params.toString() ? `?${params.toString()}` : "";
    try {
      const res = await fetch(`/api/store/tickets${query}`, { cache: "no-store" });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
      const data = text ? (JSON.parse(text) as Ticket[]) : [];
      setTickets(data);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, storeId]);

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Ticketlarım</h1>
            <p className="text-sm text-slate-400">Mağazanızı seçip kayıtlarınızı görüntüleyin.</p>
          </div>
          <Link className="btn-primary" href="/store/tickets/new">
            Yeni Ticket
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm block mb-1">Mağaza</label>
            <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              <option value="">Seçin</option>
              {STORES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1">Durum</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Hepsi</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button className="btn-secondary w-full" onClick={load} disabled={!storeId}>
              Listele
            </button>
          </div>
        </div>

        {!storeId && <div className="text-slate-400 text-sm">Önce mağaza seçin.</div>}
        {error && <div className="text-red-400 text-sm">{error}</div>}

        <div className="grid gap-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/store/tickets/${t.id}?store_id=${storeId}`}
              className="border border-slate-800 rounded-lg p-3 hover:border-accent bg-slate-900/60"
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold">{t.title}</div>
                <span className="text-xs px-2 py-1 rounded bg-slate-800">{statusLabels[t.status]}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {new Date(t.created_at).toLocaleString()}
              </div>
              <div className="text-sm text-slate-300 flex gap-2 mt-1 flex-wrap">
                <span>{categoryLabels[t.category] || t.category}</span>
                <span>•</span>
                <span>Etki: {impactLabels[t.impact] || t.impact}</span>
                <span>•</span>
                <span>Öncelik: {priorityLabels[t.priority] || t.priority}</span>
              </div>
            </Link>
          ))}
          {storeId && tickets.length === 0 && <div className="text-slate-400">Kayıt yok</div>}
        </div>
      </div>
    </div>
  );
}
