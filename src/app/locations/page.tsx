import type { Metadata } from "next";
import LocationCard from "@/components/LocationCard";
import { listLocations } from "@/db/locations";

export const metadata: Metadata = {
  title: "Fotostanovištia — MMC Photoday",
};

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const locations = await listLocations();

  return (
    <section>
      <h1 className="page-title">Fotostanovištia</h1>
      <p className="page-lead">
        Prezrite si miesta, kde sa bude fotiť na Photoday. Každé stanovište má
        vlastný rozvrh a atmosféru vhodnú pre rôzne štýly cosplayu.
      </p>

      {locations.length === 0 ? (
        <div className="empty-state">
          <p>Zoznam fotostanovišť zatiaľ nie je zverejnený.</p>
          <p className="empty-state-hint">
            Stanovištia sa tu objavia po importe katalógu organizátormi.
          </p>
        </div>
      ) : (
        <div className="location-grid">
          {locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      )}
    </section>
  );
}
