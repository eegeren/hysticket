export type AuthRole = "admin" | "store";

const COOKIE_TOKEN = "hys_token";
const COOKIE_ROLE = "hys_role";

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Expires=${expires}; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
  }
  return null;
}

export function setTokenCookie(token: string, opts?: { role?: AuthRole; days?: number }) {
  setCookie(COOKIE_TOKEN, token, opts?.days ?? 7);
  setCookie(COOKIE_ROLE, opts?.role ?? "admin", opts?.days ?? 7);
}

export function getTokenCookie(): string | null {
  return getCookie(COOKIE_TOKEN);
}

// BACKWARD COMPAT: eski kodlar getToken bekliyor
export function getToken(): string | null {
  return getTokenCookie();
}

// BACKWARD COMPAT (store login eski kodu setToken bekliyor)
export function setToken(token: string) {
  setTokenCookie(token, { role: "store" });
}

export function clearAuthCookies() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_TOKEN}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `${COOKIE_ROLE}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/** BACKWARD COMPAT (eski sayfalar için) */
export function setAdminSecret(secret: string) {
  setTokenCookie(secret, { role: "admin" });
}
export function getAdminSecret(): string | null {
  return getTokenCookie();
}
