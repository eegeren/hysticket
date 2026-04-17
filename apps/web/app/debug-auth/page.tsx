"use client";

import { useState } from "react";
import { STORES } from "@/lib/stores";

export default function DebugAuthPage() {
  const [storeId, setStoreId] = useState("");
  const [out, setOut] = useState("");

  async function login() {
    setOut("Logging in...");
    const res = await fetch("/api/store/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // cookie set/taşıma garanti
      body: JSON.stringify({ storeId }),
      cache: "no-store",
    });
    const text = await res.text();
    setOut(`LOGIN => HTTP ${res.status}\n${text}`);
  }

  async function me() {
    setOut("Checking /api/store/me ...");
    const res = await fetch("/api/store/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const text = await res.text();
    setOut(`ME => HTTP ${res.status}\n${text}`);
  }

  return (
    <div style={{ padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Debug Auth</h1>

      <div style={{ marginTop: 12 }}>
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)}>
          <option value="" disabled>
            Mağaza seç
          </option>
          {STORES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id} — {s.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button onClick={login} disabled={!storeId}>
          Login (cookie set)
        </button>
        <button onClick={me}>Check /api/store/me</button>
      </div>

      <pre style={{ marginTop: 16, padding: 12, background: "#111", color: "#eee", borderRadius: 8, whiteSpace: "pre-wrap" }}>
        {out}
      </pre>
    </div>
  );
}
