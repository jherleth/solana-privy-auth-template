import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Privy Auth + Wallet",
  description: "Social login + embedded Solana wallet powered by Privy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
