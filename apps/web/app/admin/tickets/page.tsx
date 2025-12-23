"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAdminSecret } from "@/lib/auth";

type Status = "OPEN" | "IN_PROGRESS" | "WAITING_STORE" | "RESOLVED" | "CLOSED";
type Priority = "P1" | "P2" | "P3" | "P4";

type Ticket = {
  id: string;
  store_id: string;
  device_id?: string | null;
  title: string;
  description: string;
  category: string;
  impact: string;
  priority: Priority;
  status: Status;
  assigned_to?: string | null;
  created_at?: string;
  updated_at?: string;
  closed_at?: string | null;
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
    const err: any = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
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
  const [err, setErr] = useState<string | null>(null);

  // edit state
  const [status, setStatus] = useState<Status>("OPEN");
  const [priority, setPriority] = useState<Priority>("P3");
  const [assignedTo, setAssignedTo] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [closeCode, setCloseCode] = useState("");

  useEffect(() => {
    if (!ticketId) {
      setLoading(false);
      setErr("Ticket ID bulunamadı.");
      return;
    }

    const token = getAdminSecret();
    if (!token) {
      router.replace(`/admin/login?next=/admin/tickets/${ticketId}`);
      return;
    }

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const t = await fetchJson<Ticket>(`/api/tickets/${ticketId}`, {
          headers: { "X-Admin-Password": token },
          cache: "no-store",
        });

        setTicket(t);
        setStatus(t.status);
        setPriority(t.priority);
        setAssignedTo(t.assigned_to ?? "");
        setResolutionNote(t.resolution_note ?? "");
        setCloseCode(t.close_code ?? "");
      } catch (e: any) {
        setErr(e?.message ?? "Ticket yüklenemedi.");
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
    setErr(null);
    try {
      const payload: any = {
        status,
        priority,
        assigned_to: assignedTo || null,
        resolution_note: resolutionNote || null,
        close_code: closeCode || null,
      };

      const updated = await fetchJson<Ticket>(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Password": token,
        },
        body: JSON.stringify(payload),
      });

      setTicket(updated);
    } catch (e: any) {
      setErr(e?.message ?? "Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>;
  }

  if (err) {
    return (
      <div className="p-6 space-y-3">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {err}
        </div>
        <button className="rounded-xl border px-3 py-2" onClick={() => router.back()}>
          Geri
        </button>
      </div>
    );
  }

  if (!ticket) {
    return <div className="p-6">Ticket bulunamadı.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Ticket Detay</h1>
          <div className="mt-1 text-sm text-slate-600">
            <span className="font-mono">{ticket.id}</span>
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
          <div className="grid gap-3">
            <label className="text-sm">
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

            <label className="text-sm">
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

            <label className="text-sm">
              Assigned To
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="örn: IT-1 / Yusuf / Vendor"
              />
            </label>

            <label className="text-sm">
              Close Code (opsiyonel)
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={closeCode}
                onChange={(e) => setCloseCode(e.target.value)}
                placeholder="FIXED / VENDOR / USER_ERROR ..."
              />
            </label>

            <label className="text-sm">
              Resolution Note (opsiyonel)
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
    </div>
  );
}
