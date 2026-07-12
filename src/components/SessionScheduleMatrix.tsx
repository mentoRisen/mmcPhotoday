import Link from "next/link";
import type { ConfirmedSessionSummary } from "@/db/applications";
import { confirmedSessionKey } from "@/db/applications";
import type { Location, Timeslot } from "@/db/schema";

function formatTimeslot(label: string, startTime: string): string {
  const time = startTime.slice(0, 5);
  return time ? `${label} (${time})` : label;
}

export default function SessionScheduleMatrix({
  locations,
  timeslots,
  sessionsByKey,
}: {
  locations: Pick<Location, "id" | "name">[];
  timeslots: Pick<Timeslot, "id" | "label" | "startTime">[];
  sessionsByKey: Record<string, ConfirmedSessionSummary>;
}) {
  const hasConfirmedSessions = Object.keys(sessionsByKey).length > 0;

  return (
    <div className="schedule-matrix-section">
      {!hasConfirmedSessions ? (
        <div className="empty-state schedule-matrix-empty">
          <p>Zatiaľ nie sú potvrdené žiadne fotenia.</p>
          <p className="empty-state-hint">
            Po schválení fotografom sa tu zobrazia potvrdené termíny.
          </p>
        </div>
      ) : null}

      <div className="schedule-matrix-scroll">
        <table className="schedule-matrix">
          <thead>
            <tr>
              <th scope="col" className="schedule-matrix-corner">
                Stanovište
              </th>
              {timeslots.map((timeslot) => (
                <th key={timeslot.id} scope="col">
                  {formatTimeslot(
                    timeslot.label,
                    String(timeslot.startTime),
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id}>
                <th scope="row" className="schedule-matrix-row-header">
                  {location.name}
                </th>
                {timeslots.map((timeslot) => {
                  const session =
                    sessionsByKey[
                      confirmedSessionKey(location.id, timeslot.id)
                    ];

                  return (
                    <td key={timeslot.id} className="schedule-matrix-cell">
                      {session ? (
                        <div className="schedule-matrix-session">
                          <span className="schedule-matrix-cosplayer">
                            {session.cosplayerName}
                          </span>
                          <Link
                            href={`/photographers/${session.photographerId}`}
                            className="schedule-matrix-photographer"
                          >
                            {session.photographerName}
                          </Link>
                        </div>
                      ) : (
                        <span className="schedule-matrix-empty-cell">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
