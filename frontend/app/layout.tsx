import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/sidebar";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "V4 Voice Agent",
  description: "Painel de gestão de leads e ligações com IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased dark`}>
      <body className="h-full flex bg-[#080808] text-[#f0f0f0]">
        <Providers>
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
