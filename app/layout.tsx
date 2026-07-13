import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { auth } from "@/lib/auth";
import { Providers } from "@/app/providers";
import { Nav } from "@/components/Nav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Help Desk Inteligente en la Nube",
  description: "Tickets de soporte clasificados automáticamente con IA, 100% cloud-native.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="es" className={`h-full ${inter.variable}`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <Providers>
          <Nav user={session?.user ?? null} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-surface-border px-4 py-6 text-center text-xs text-zinc-500">
            Help Desk Inteligente en la Nube — Next.js · MongoDB Atlas · Gemini · n8n · Trello
          </footer>
        </Providers>
      </body>
    </html>
  );
}
