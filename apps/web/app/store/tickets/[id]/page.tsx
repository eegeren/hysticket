"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { Ticket } from "../../../../lib/types";

const statusStyles: Record<string, { bg: string; color: string; border: string; label: string }> = {
  OPEN: { bg: "#312e81", color: "#e0e7ff", border: "#4338ca", label: "Açık" },
  IN_PROGRESS: { bg: "#0f766e", color: "#ccfbf1", border: "#115e59", label: "Kabul edildi" },
  WAITING_STORE: { bg: "#6d28d9", color: "#f3e8ff", border: "#5b21b6", label: "Mağaza beklemede" },
  RESOLVED: { bg: "#166534", color: "#d1fae5", border: "#15803d", label: "Çözüldü" },
  CLOSED: { bg: "#1f2937", color: "#e5e7eb", border: "#111827", label: "Kapalı" },
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

export default function TicketDetailPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 text-sm">Yükleniyor...</div>}>
      <TicketDetailContent />
    </Suspense>
  );
}

function TicketDetailContent() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const storeId = search?.get("store_id") || "";
  const ticketId = params?.id;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setStoreSession = async (store: string) => {
    await fetch("/api/store/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId: store }),
      credentials: "include",
    });
  };

  const load = async () => {
    if (!ticketId || !storeId) return;
    try {
      await setStoreSession(storeId);
      const res = await fetch(`/api/store/tickets/${ticketId}?store_id=${storeId}`, { cache: "no-store" });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
      const data = text ? (JSON.parse(text) as Ticket) : null;
      setTicket(data);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, storeId]);

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      await fetch(`/api/store/tickets/${ticketId}/attachments?store_id=${storeId}`, {
        method: "POST",
        body: form,
      }).then((resp) => {
        if (!resp.ok) throw new Error("Upload failed");
      });
      load();
    } catch (err: any) {
      setError(err.message || "Dosya yüklenemedi");
    }
  };

  if (!ticketId) return null;

  const badge = ticket ? statusStyles[ticket.status] || statusStyles.OPEN : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {(!storeId || !ticket) && <div style={{ color: "#94a3b8", fontSize: "13px" }}>Mağaza bilgisi olmadan görüntülenemez.</div>}
      {error && <div style={{ color: "#f87171", fontSize: "13px" }}>{error}</div>}
      {ticket && (
        <div className="card" style={{ boxShadow: "0 20px 60px rgba(26,198,255,0.08)", borderRadius: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontSize: "12px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#1ac6ff" }}>
                  {categoryLabels[ticket.category] || ticket.category}
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700 }}>{ticket.title}</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "12px" }}>
                  {badge && (
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: "10px",
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.label}
                    </span>
                  )}
                  <span style={{ padding: "6px 10px", borderRadius: "10px", background: "#0b1222", border: "1px solid #1f2937" }}>
                    Etki: {impactLabels[ticket.impact] || ticket.impact}
                  </span>
                  <span style={{ padding: "6px 10px", borderRadius: "10px", background: "#0b1222", border: "1px solid #1f2937" }}>
                    Öncelik: {priorityLabels[ticket.priority] || ticket.priority}
                  </span>
                </div>
                <div style={{ fontSize: "14px", color: "#cbd5e1" }}>
                  Açan: <span style={{ color: "#e2e8f0" }}>{ticket.requester_name}</span>
                </div>
                <div style={{ fontSize: "14px", color: "#cbd5e1" }}>Atanan: {ticket.assigned_to || "-"}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Oluşturma: {new Date(ticket.created_at).toLocaleString()}
                  {ticket.updated_at && ` · Güncelleme: ${new Date(ticket.updated_at).toLocaleString()}`}
                </div>
              </div>
              <div
                style={{
                  minWidth: "220px",
                  background: "#0b1222",
                  border: "1px solid #1f2937",
                  borderRadius: "12px",
                  padding: "12px",
                  color: "#e2e8f0",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: "6px" }}>Özet</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#cbd5e1" }}>
                  <span>Mağaza</span>
                  <span style={{ color: "#e2e8f0" }}>{ticket.store_id}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#cbd5e1" }}>
                  <span>Cihaz</span>
                  <span style={{ color: "#e2e8f0" }}>{ticket.device_id || "-"}</span>
                </div>
                {ticket.resolution_note && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8" }}>Çözüm Notu</div>
                    <div style={{ whiteSpace: "pre-line", color: "#e2e8f0", fontSize: "13px" }}>{ticket.resolution_note}</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: "#0b1222", border: "1px solid #1f2937", borderRadius: "12px", padding: "14px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Açıklama</h3>
              <p style={{ color: "#e2e8f0", whiteSpace: "pre-line", fontSize: "14px" }}>{ticket.description}</p>
            </div>

            <div
              style={{
                background: "#0b1222",
                border: "1px solid #1f2937",
                borderRadius: "12px",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 600 }}>Notlar</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {ticket.comments?.map((c) => (
                  <div key={c.id} style={{ border: "1px solid #1f2937", borderRadius: "10px", padding: "10px", background: "#0f172a" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94a3b8" }}>
                      <span>{c.author_role}</span>
                      <span>{new Date(c.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ color: "#e2e8f0", marginTop: "6px", whiteSpace: "pre-line" }}>{c.body}</div>
                  </div>
                ))}
                {(!ticket.comments || ticket.comments.length === 0) && <div style={{ color: "#94a3b8", fontSize: "13px" }}>Not yok</div>}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                background: "#0b1222",
                border: "1px solid #1f2937",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 600 }}>Ekler</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {ticket.attachments?.map((a) => (
                  <a
                    key={a.id}
                    style={{ display: "flex", justifyContent: "space-between", color: "#e2e8f0", fontSize: "14px" }}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{a.file_name}</span>
                    <span style={{ color: "#94a3b8", fontSize: "12px" }}>{Math.round(a.size / 1024)} KB</span>
                  </a>
                ))}
                {ticket.attachments?.length === 0 && <div style={{ color: "#94a3b8", fontSize: "13px" }}>Ek yok</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", color: "#cbd5e1" }}>Dosya yükle</label>
                <input
                  type="file"
                  onChange={uploadFile}
                  style={{ background: "#0f172a", color: "#e2e8f0", border: "1px solid #1f2937", borderRadius: "10px", padding: "8px" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
