import type { Metadata } from "next";
import "./globals.css";
import { WalletContextProvider } from "@/contexts/WalletContextProvider";
import { ConnectButton } from "@/components/ConnectButton";
import { FaucetButton } from "@/components/FaucetButton";

export const metadata: Metadata = {
  title: "RebelBulls Den | $ANSEM Prediction Market",
  description: "Moderated $ANSEM-only prediction market. Fun. Fair. Only bulls.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="rbd-bg bg-zinc-950 text-zinc-100 min-h-screen">
        <WalletContextProvider>
          <header className="border-b border-zinc-800/80 px-6 py-3 flex items-center justify-between backdrop-blur-sm bg-zinc-950/40">
            <a href="/" className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/rebelbulls-logo.png"
                alt="RebelBulls Den"
                className="h-14 w-auto rbd-logo"
              />
            </a>
            <nav className="flex items-center gap-6 text-sm">
              <a href="/" className="hover:text-red-400">Markets</a>
              <a href="/create" className="hover:text-red-400">Create</a>
              <a href="/portfolio" className="hover:text-red-400">Portfolio</a>
              <FaucetButton />
              <ConnectButton />
            </nav>
          </header>
          <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
        </WalletContextProvider>
      </body>
    </html>
  );
}