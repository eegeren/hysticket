import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HYS Köroğlu Arıza Kayıtları",
  description: "Store and admin ticketing portal",
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
          .btn { padding: 10px 16px; border-radius: 10px; font-weight: 600; transition: all 0.2s ease; }
          .btn-primary { background: #1f4b99; color: white; }
          .btn-primary:hover { background: #1c4389; }
          .btn-secondary { background: #1e293b; color: white; }
          .btn-secondary:hover { background: #273447; }
          input, select, textarea { background: #0b1222; border: 1px solid #1e293b; border-radius: 10px; padding: 10px 12px; width: 100%; color: #e2e8f0; }
          input::placeholder, textarea::placeholder { color: #64748b; }
        `}</style>
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <header className="flex items-center justify-between">
            <div className="text-xl font-bold">HYS Köroğlu Arıza Kayıtları</div>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/store/tickets" className="text-accent">
                Mağaza Ticketları
              </Link>
              <Link href="/admin/tickets" className="text-accent">
                Admin
              </Link>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
