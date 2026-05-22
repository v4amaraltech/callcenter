import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar, MobileMenuButton } from "@/components/sidebar";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "V4 Call",
  description: "Painel de gestão de leads e ligações com IA",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="h-full bg-background text-foreground">
        <Providers>
          <div className="flex h-screen w-full overflow-hidden bg-background">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
              {/* Header mobile — oculto em lg+ */}
              <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
                <MobileMenuButton />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">V4</span>
                  <span className="text-base font-semibold tracking-[0.18em] text-foreground">CALL</span>
                </div>
              </header>
              <main className="flex-1 overflow-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7 2xl:px-10">
                <div className="page-shell">{children}</div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
