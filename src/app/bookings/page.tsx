import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rezervácie — MMC Photoday",
};

export default function BookingsPage() {
  return (
    <section>
      <h1 className="page-title">Rezervácie</h1>
      <p className="page-lead">
        Tu si cosplayeri budú rezervovať fotenie — výber fotostanovišťa,
        časového okna a fotografa. Formulár pribudne v ďalšej fáze.
      </p>
      <span className="placeholder-badge">Pripravuje sa</span>
    </section>
  );
}
