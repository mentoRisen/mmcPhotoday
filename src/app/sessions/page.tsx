import type { Metadata } from "next";
import SessionScheduleMatrix from "@/components/SessionScheduleMatrix";
import {
  confirmedSessionKey,
  listConfirmedSessions,
} from "@/db/applications";
import { listLocations } from "@/db/locations";
import { listBookableTimeslots } from "@/db/timeslots";

export const metadata: Metadata = {
  title: "Termíny — MMC Photoday",
};

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const [locations, timeslots, confirmedSessions] = await Promise.all([
    listLocations(),
    listBookableTimeslots(),
    listConfirmedSessions(),
  ]);

  const catalogReady = locations.length > 0 && timeslots.length > 0;

  const sessionsByKey = Object.fromEntries(
    confirmedSessions.map((session) => [
      confirmedSessionKey(session.locationId, session.timeslotId),
      session,
    ]),
  );

  return (
    <section>
      <h1 className="page-title">Termíny</h1>
      <p className="page-lead">
        Prehľad potvrdených fotení podľa stanovišťa a času. Tu nájdeš, kto sa
        kde a kedy odfotí po schválení fotografom.
      </p>

      {!catalogReady ? (
        <div className="empty-state">
          <p>Rozvrh zatiaľ nie je k dispozícii.</p>
          <p className="empty-state-hint">
            Termíny sa tu zobrazia po importe stanovišť a spustení rezervácií.
          </p>
        </div>
      ) : (
        <SessionScheduleMatrix
          locations={locations}
          timeslots={timeslots}
          sessionsByKey={sessionsByKey}
        />
      )}
    </section>
  );
}
