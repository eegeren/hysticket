import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "HYS Köroğlu Arıza Kayıtları",
  description: "Mağaza ve admin arıza kayıt portalı",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="font-sans">
        <style>{`
          :root { color-scheme: dark; }
          body { background: #0f172a; color: #e2e8f0; min-height: 100vh; }
          a { color: #1ac6ff; }
          .card { background: rgba(15,23,42,0.7); border: 1px solid #1e293b; border-radius: 12px; padding: 24px; box-shadow: 0 10px 40px rgba(26,198,255,0.08); }
          .btn { padding: 10px 16px; border-radius: 10px; font-weight: 600; transition: all 0.2s ease; cursor: pointer; }
          .btn-primary { background: #1f4b99; color: white; border: none; }
          .btn-primary:hover { background: #1c4389; }
          .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
          .btn-secondary { background: #1e293b; color: white; border: none; }
          .btn-secondary:hover { background: #273447; }
          .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
          input, select, textarea { background: #0b1222; border: 1px solid #1e293b; border-radius: 10px; padding: 10px 12px; width: 100%; color: #e2e8f0; outline: none; transition: border-color 0.15s; }
          input:focus, select:focus, textarea:focus { border-color: #1ac6ff; box-shadow: 0 0 0 3px rgba(26,198,255,0.12); }
          input::placeholder, textarea::placeholder { color: #64748b; }
          select option { background: #0b1222; }
        `}</style>

        <nav className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 no-underline" style={{ textDecoration: "none" }}>
              <Image src="/logo.png" alt="HYS Köroğlu" width={32} height={32} className="rounded-md" />
              <span className="text-base font-bold tracking-tight text-slate-100">HYS Köroğlu</span>
              <span className="hidden sm:inline text-xs text-slate-500 font-normal">Arıza Kayıtları</span>
            </Link>
            <div className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 transition-colors no-underline"
                style={{ textDecoration: "none", color: "#cbd5e1" }}
              >
                Yeni Ticket
              </Link>
              <Link
                href="/store/tickets"
                className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
                style={{ textDecoration: "none", color: "#cbd5e1" }}
              >
                Mağaza
              </Link>
              <Link
                href="/admin/tickets"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
                style={{ textDecoration: "none", color: "#94a3b8" }}
              >
                Admin
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          {children}
        </div>
      </body>
    </html>
  );
}
