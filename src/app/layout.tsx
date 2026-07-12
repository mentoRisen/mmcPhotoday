import type { Metadata } from "next";
import { DM_Serif_Display, Work_Sans } from "next/font/google";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  weight: "400",
});

const workSans = Work_Sans({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
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
    <html lang="sk" className={`${dmSerif.variable} ${workSans.variable}`}>
      <body>
        <SiteNav />
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          <p>
            <a href="https://minimoviecon.sk" className="site-footer-link">
              Mini Movie Con
            </a>
            {" · "}
            Photoday · {new Date().getFullYear()}
          </p>
        </footer>
      </body>
    </html>
  );
}
