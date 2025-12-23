"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAdminSecret } from "@/lib/auth";
import { STORES } from "@/lib/stores";

type Status = "OPEN" | "IN_PROGRESS" | "WAITING_STORE" | "RESOLVED" | "CLOSED";
type Priority = "P1" | "P2" | "P3" | "P4";

type Ticket = {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: string;
  priority: Priority;
  status: Status;
  assigned_to?: string | null;
  close_code?: string | null;
  resolution_note?: string | null;
};

const statuses: Status[] = ["OPEN", "IN_PROGRESS", "WAITING_STORE", "RESOLVED", "CLOSED"];
const priorities: Priority[] = ["P1", "P2", "P3", "P4"];

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

export default function AdminTicketDetailPage() {
  const router = useRouter();
  const params = useParams();

  const ticketId = useMemo(() => {
    const v = (params as any)?.id;
    return Array.isArray(v) ? v[0] : v;
  }, [params]);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>("OPEN");
  const [priority, setPriority] = useState<Priority>("P3");
  const [assignedTo, setAssignedTo] = useState("");
  const [closeCode, setCloseCode] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");

  useEffect(() => {
    if (!ticketId) {
      setLoading(false);
      setError("Ticket ID bulunamadı.");
      return;
    }

    const token = getAdminSecret();
    if (!token) {
      router.replace(`/admin/login?next=/admin/tickets/${ticketId}`);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const t = await fetchJson<Ticket>(`/api/tickets/${ticketId}`, {
          headers: { "X-Admin-Password": token },
          cache: "no-store",
        });

        setTicket(t);
        setStatus(t.status);
        setPriority(t.priority);
        setAssignedTo(t.assigned_to ?? "");
        setCloseCode(t.close_code ?? "");
        setResolutionNote(t.resolution_note ?? "");
      } catch (e: any) {
        setError(e?.message ?? "Ticket yüklenemedi.");
      } finally {
        setLoading(false);
      }
    })();
  }, [ticketId, router]);

  async function onSave() {
    if (!ticketId) return;

    const token = getAdminSecret();
    if (!token) {
      router.replace(`/admin/login?next=/admin/tickets/${ticketId}`);
      return;
    }

      setSaving(true);
      setError(null);
      try {
        const updated = await fetchJson<Ticket>(`/api/admin/tickets/${ticketId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Password": token,
          },
          body: JSON.stringify({
            status,
          priority,
          assigned_to: assignedTo || null,
          close_code: closeCode || null,
          resolution_note: resolutionNote || null,
        }),
      });

      setTicket(updated);
    } catch (e: any) {
      setError(e?.message ?? "Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Yükleniyor...</div>;

  if (error) {
    return (
      <div className="p-6 space-y-3">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
        <button className="rounded-xl border px-3 py-2" onClick={() => router.back()}>
          Geri
        </button>
      </div>
    );
  }

  if (!ticket) return <div className="p-6">Ticket bulunamadı.</div>;

  const store = STORES.find((s) => s.id === ticket.store_id);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Ticket Detay</h1>
          <div className="mt-1 text-sm text-slate-400">
            {store ? `${store.name} (${store.id})` : ticket.store_id}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-emerald-100">
              Durum: {ticket.status}
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg border border-sky-300/40 bg-sky-400/10 px-3 py-1 text-sky-100">
              Öncelik: {ticket.priority}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="rounded-xl border px-3 py-2" onClick={() => router.back()}>
            Geri
          </button>
          <button
            className="rounded-xl border px-3 py-2 font-medium disabled:opacity-60"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border p-4 space-y-2">
          <div className="text-sm text-slate-500">Başlık</div>
          <div className="font-medium">{ticket.title}</div>

          <div className="mt-3 text-sm text-slate-500">Açıklama</div>
          <div className="whitespace-pre-wrap text-sm">{ticket.description}</div>
        </div>

        <div className="rounded-2xl border p-4 space-y-4">
          <label className="text-sm block">
            Status
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm block">
            Priority
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm block">
            Assigned To
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="örn: IT-1 / Vendor"
            />
          </label>

          <label className="text-sm block">
            Close Code
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={closeCode}
              onChange={(e) => setCloseCode(e.target.value)}
              placeholder="FIXED / VENDOR / USER_ERROR"
            />
          </label>

          <label className="text-sm block">
            Resolution Note
            <textarea
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={4}
              placeholder="Çözüm notu..."
            />
          </label>
        </div>
      </div>
    </div>
  );
}
