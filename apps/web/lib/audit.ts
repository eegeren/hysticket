export async function writeAuditLog(input: { action: string; path: string; metadata?: Record<string, unknown> }) {
  await fetch("/api/audit-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: input.action,
      path: input.path,
      metadata: input.metadata ?? {},
    }),
  });
}
