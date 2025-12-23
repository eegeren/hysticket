import { getToken, getAdminSecret } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type ApiOptions = RequestInit & { rawResponse?: boolean };

export async function apiFetch<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = getToken();
  const adminSecret = getAdminSecret();

  const baseHeaders =
    options.headers instanceof Headers ? Object.fromEntries(options.headers.entries()) : ((options.headers as Record<string, string>) || {});

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...baseHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (adminSecret) {
    headers["X-Admin-Password"] = adminSecret;
  }

  const resp = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!resp.ok) {
    const text = await resp.text();
    let detail = text;
    try {
      const data = JSON.parse(text);
      detail = data.detail || text;
    } catch (_) {
      /* noop */
    }
    throw new Error(detail);
  }

  if (options.rawResponse) return (resp as unknown) as T;
  return (await resp.json()) as T;
}

export { API_URL };
