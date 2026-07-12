import type { Metadata } from "next";
import ApplicationForm from "@/components/ApplicationForm";
import { listConfirmedLocationTimeslotKeys, listConfirmedPhotographerTimeslotKeys } from "@/db/applications";
import { listLocations } from "@/db/locations";
import { listPhotographers } from "@/db/photographers";
import { listBookableTimeslots } from "@/db/timeslots";

export const metadata: Metadata = {
  title: "Rezervácie — MMC Photoday",
};

export const dynamic = "force-dynamic";

type BookingsPageProps = {
  searchParams: Promise<{ photographerId?: string }>;
};

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const query = await searchParams;
  const requestedPhotographerId = Number.parseInt(query.photographerId ?? "", 10);
  const defaultPhotographerId =
    Number.isFinite(requestedPhotographerId) && requestedPhotographerId > 0
      ? requestedPhotographerId
      : undefined;

  const [photographers, locations, timeslots, confirmedKeys, confirmedPhotographerTimeslotKeys] =
    await Promise.all([
    listPhotographers(),
    listLocations(),
    listBookableTimeslots(),
    listConfirmedLocationTimeslotKeys(),
    listConfirmedPhotographerTimeslotKeys(),
  ]);

  const catalogReady =
    photographers.length > 0 && locations.length > 0 && timeslots.length > 0;

  return (
    <section>
      <h1 className="page-title">Prihláška na fotenie</h1>
      <p className="page-lead">
        Vyber fotografa, fotostanovište a termín. Po odoslaní prihlášky ťa
        organizátor kontaktuje po schválení.
      </p>

      {!catalogReady ? (
        <div className="empty-state">
          <p>Rezervácie zatiaľ nie sú otvorené.</p>
          <p className="empty-state-hint">
            Fotografi a stanovištia sa zobrazia po importe katalógu organizátormi.
          </p>
        </div>
      ) : (
        <ApplicationForm
          photographers={photographers}
          locations={locations}
          timeslots={timeslots}
          confirmedKeys={confirmedKeys}
          confirmedPhotographerTimeslotKeys={confirmedPhotographerTimeslotKeys}
          defaultPhotographerId={defaultPhotographerId}
        />
      )}
    </section>
  );
}
