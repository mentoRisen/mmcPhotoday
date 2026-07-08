import type { Metadata } from "next";
import PhotographerCard from "@/components/PhotographerCard";
import { listPhotographers } from "@/db/photographers";

export const metadata: Metadata = {
  title: "Fotografi — MMC Photoday",
};

export const dynamic = "force-dynamic";

export default async function PhotographersPage() {
  const photographers = await listPhotographers();

  return (
    <section>
      <h1 className="page-title">Fotografi</h1>
      <p className="page-lead">
        Spoznajte fotografov, ktorí budú fotiť na Photoday. Pozrite si ich
        štýl a portfóliá ešte pred otvorením rezervácií.
      </p>

      {photographers.length === 0 ? (
        <div className="empty-state">
          <p>Zoznam fotografov zatiaľ nie je zverejnený.</p>
          <p className="empty-state-hint">
            Fotografi sa tu objavia po importe katalógu organizátormi.
          </p>
        </div>
      ) : (
        <div className="photographer-grid">
          {photographers.map((photographer) => (
            <PhotographerCard
              key={photographer.id}
              photographer={photographer}
            />
          ))}
        </div>
      )}
    </section>
  );
}
