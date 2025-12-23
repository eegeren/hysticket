"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminSecret } from "@/lib/auth";

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

const priorityLabels: Record<Priority, string> = {
  P1: "P1",
  P2: "P2",
  P3: "P3",
  P4: "P4",
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.detail || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export default function AdminTicketsListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAdminSecret();
    if (!token) {
      window.location.href = "/admin/login?next=/admin/tickets";
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJson<Ticket[]>("/api/admin/tickets", {
          headers: { "X-Admin-Password": token },
          cache: "no-store",
        });
        setTickets(data);
      } catch (e: any) {
        setError(e?.message ?? "Liste alınamadı.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Yükleniyor...</div>;

  if (error) {
    return (
      <div className="p-6 space-y-3">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
        <button className="rounded-xl border px-3 py-2" onClick={() => (window.location.href = "/admin/login")}>
          Giriş ekranına git
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Admin Ticketları</h1>
          <p className="text-sm text-slate-400">Son ticket kayıtları</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-slate-900/30 backdrop-blur">
        <div className="grid grid-cols-[2fr,1fr,1fr,1fr,1.5fr] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 border-b border-slate-800">
          <div>ID</div>
          <div>Mağaza</div>
          <div>Status</div>
          <div>Öncelik</div>
          <div>Oluşturma</div>
        </div>
        <div className="divide-y divide-slate-800/70">
          {tickets.map((t, idx) => (
            <Link
              key={t.id}
              href={`/admin/tickets/${t.id}`}
              className={`grid grid-cols-[2fr,1fr,1fr,1fr,1.5fr] px-4 py-3 text-sm transition hover:bg-slate-800/60 ${
                idx % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/20"
              }`}
            >
              <span className="font-mono text-xs text-slate-200 truncate">{t.id}</span>
              <span className="text-slate-100">{t.store_id}</span>
              <span className="text-emerald-200">{statusLabels[t.status] ?? t.status}</span>
              <span className="text-sky-200">{priorityLabels[t.priority] ?? t.priority}</span>
              <span className="text-slate-300">{t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</span>
            </Link>
          ))}
          {tickets.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-400">Kayıt bulunamadı.</div>
          )}
        </div>
      </div>
    </div>
  );
}
