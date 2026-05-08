"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAdminSecret } from "@/lib/auth";
import { STORES } from "@/lib/stores";

type Status = "OPEN" | "IN_PROGRESS" | "WAITING_STORE" | "RESOLVED" | "CLOSED";
type Priority = "P1" | "P2" | "P3" | "P4";

type Ticket = {
  id: string;
  store_id: string;
  requester_name?: string | null;
  full_name?: string | null;
  title: string;
  description: string;
  category: string;
  impact: string;
  priority: Priority;
  status: Status;
  assigned_to?: string | null;
  close_code?: string | null;
  resolution_note?: string | null;
  created_at?: string;
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

const categoryLabelMap: Record<string, string> = {
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

const fieldCls =
  "w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-accent transition";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(data?.detail || data?.error || `HTTP ${res.status}`);
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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>("OPEN");
  const [priority, setPriority] = useState<Priority>("P3");
  const [assignedTo, setAssignedTo] = useState("");
  const [closeCode, setCloseCode] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");

  useEffect(() => {
    if (!ticketId) { setLoading(false); setError("Ticket ID bulunamadı."); return; }
    const token = getAdminSecret();
    if (!token) { router.replace(`/admin/login?next=/admin/tickets/${ticketId}`); return; }

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
    if (!token) { router.replace(`/admin/login?next=/admin/tickets/${ticketId}`); return; }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const updated = await fetchJson<Ticket>(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Admin-Password": token },
        body: JSON.stringify({
          status,
          priority,
          assigned_to: assignedTo || null,
          close_code: closeCode || null,
          resolution_note: resolutionNote || null,
        }),
      });
      setTicket(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setError(e?.message ?? "Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    const token = getAdminSecret();
    if (!token || !ticketId) return;
    if (!confirm("Bu ticket kalıcı olarak silinecek. Emin misiniz?")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "DELETE",
        headers: { "X-Admin-Password": token },
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
      router.push("/admin/tickets");
    } catch (e: any) {
      setError(e?.message ?? "Silme başarısız.");
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-slate-400 text-sm">Yükleniyor...</div>;

  if (error && !ticket) {
    return (
      <div className="p-6 space-y-3">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">{error}</div>
        <button className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200" onClick={() => router.back()}>Geri</button>
      </div>
    );
  }

  if (!ticket) return <div className="p-6 text-slate-400 text-sm">Ticket bulunamadı.</div>;

  const store = STORES.find((s) => s.id === ticket.store_id);
  const requester = ticket.requester_name || ticket.full_name;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <button onClick={() => router.back()} className="hover:text-slate-200 transition">← Geri</button>
            <span>/</span>
            <span className="text-slate-300">Ticket #{ticketId?.slice(0, 8)}</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-100">{ticket.title}</h1>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${statusColors[ticket.status]}`}>
              {statuses.find((s) => s.value === ticket.status)?.label ?? ticket.status}
            </span>
            <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${priorityColors[ticket.priority]}`}>
              {ticket.priority}
            </span>
            <span className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300">
              {categoryLabelMap[ticket.category] ?? ticket.category}
            </span>
            <span className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300">
              Etki: {impactLabels[ticket.impact] ?? ticket.impact}
            </span>
            {requester && (
              <span className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300">
                Açan: {requester}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 transition disabled:opacity-50"
            disabled={saving}
            onClick={onDelete}
          >
            Sil
          </button>
          <button
            className="btn btn-primary text-sm disabled:opacity-60"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? "Kaydediliyor..." : saveSuccess ? "Kaydedildi ✓" : "Kaydet"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Ticket bilgileri */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Mağaza</div>
            <div className="text-slate-200 font-medium">{store ? `${store.name} (${store.id})` : ticket.store_id}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Başlık</div>
            <div className="text-slate-100 font-medium">{ticket.title}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Açıklama</div>
            <div className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed">{ticket.description}</div>
          </div>
          {ticket.created_at && (
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Oluşturma</div>
              <div className="text-sm text-slate-400">{new Date(ticket.created_at).toLocaleString("tr-TR")}</div>
            </div>
          )}
        </div>

        {/* Düzenleme formu */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Durum</label>
            <select className={fieldCls} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Öncelik</label>
            <select className={fieldCls} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Atanan Kişi</label>
            <input
              className={fieldCls}
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="örn: IT-1 / Vendor"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Kapatma Kodu</label>
            <input
              className={fieldCls}
              value={closeCode}
              onChange={(e) => setCloseCode(e.target.value)}
              placeholder="FIXED / VENDOR / USER_ERROR"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest block mb-1.5">Çözüm Notu</label>
            <textarea
              className={fieldCls}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={4}
              placeholder="Çözüm notu..."
              style={{ resize: "vertical" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
