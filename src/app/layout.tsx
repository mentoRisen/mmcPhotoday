import type { Metadata } from "next";
import { Geist } from "next/font/google";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MMC Photoday — Mini Movie Con",
  description:
    "Fotenie na Mini Movie Con: koordinácia fotografov, cosplayerov a termínov na jednom mieste.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" className={geistSans.variable}>
      <body>
        <SiteNav />
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          <p>Mini Movie Con · Photoday · {new Date().getFullYear()}</p>
        </footer>
      </body>
    </html>
  );
}
