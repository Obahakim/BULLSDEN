import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bull's Den | $ANSEM Prediction Market",
  description: "Moderated $ANSEM-only prediction market. Fun. Fair. Only bulls.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">
        <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-900 flex items-center justify-center text-xl">
              🐂
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">Bull&apos;s Den</h1>
              <p className="text-xs text-zinc-500">$ANSEM only</p>
            </div>
          </div>
          <nav className="flex gap-6 text-sm">
            <a href="/" className="hover:text-red-400">Markets</a>
            <a href="/create" className="hover:text-red-400">Create</a>
            <a href="/admin" className="hover:text-red-400">Admin</a>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
