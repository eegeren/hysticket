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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Admin Ticketları</h1>
          <p className="text-sm text-slate-500">Son ticket kayıtları</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white/70 p-4 shadow-sm">
        <div className="grid grid-cols-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <div>ID</div>
          <div>Mağaza</div>
          <div>Status</div>
          <div>Öncelik</div>
          <div>Oluşturma</div>
        </div>
        <div className="divide-y">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/admin/tickets/${t.id}`}
              className="grid grid-cols-5 py-3 text-sm hover:bg-slate-100 transition"
            >
              <span className="font-mono text-xs">{t.id}</span>
              <span>{t.store_id}</span>
              <span>{statusLabels[t.status] ?? t.status}</span>
              <span>{priorityLabels[t.priority] ?? t.priority}</span>
              <span>{t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</span>
            </Link>
          ))}
          {tickets.length === 0 && <div className="py-4 text-sm text-slate-500">Kayıt bulunamadı.</div>}
        </div>
      </div>
    </div>
  );
}
