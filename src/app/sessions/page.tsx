import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termíny — MMC Photoday",
};

export default function SessionsPage() {
  return (
    <section>
      <h1 className="page-title">Termíny</h1>
      <p className="page-lead">
        Prehľad naplánovaných fotení podľa stanovišťa a času. Zoznamy pribudnú
        po spustení rezervácií.
      </p>
      <span className="placeholder-badge">Pripravuje sa</span>
    </section>
  );
}
