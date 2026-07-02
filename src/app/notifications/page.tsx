import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifikácie — MMC Photoday",
};

export default function NotificationsPage() {
  return (
    <section>
      <h1 className="page-title">Notifikácie</h1>
      <p className="page-lead">
        Upozornenia na potvrdené fotenia a zmeny termínov. Doručovanie
        notifikácií pribudne neskôr.
      </p>
      <span className="placeholder-badge">Pripravuje sa</span>
    </section>
  );
}
