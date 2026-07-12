"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { PhotographerApplicationSummary } from "@/db/applications";
import type { Location, Timeslot } from "@/db/schema";
import ActionAlertDialog from "@/components/ActionAlertDialog";
import {
  confirmApplicationAction,
  revokeApplicationAction,
  type PhotographerActionState,
} from "@/app/photographers/[id]/actions";

const initialActionState: PhotographerActionState = {};

function formatTimeslot(label: string, startTime: string): string {
  const time = startTime.slice(0, 5);
  return time ? `${label} (${time})` : label;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("sk-SK", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Bratislava",
  }).format(value);
}

function statusLabel(status: PhotographerApplicationSummary["status"]): string {
  return status === "confirmed" ? "Potvrdené" : "Čaká na schválenie";
}

function ActionButton({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? "Ukladám…" : label}
    </button>
  );
}

export default function PhotographerApplicationList({
  applications,
  locations,
  timeslots,
  canManage = false,
  photographerId,
  loginHash,
}: {
  applications: PhotographerApplicationSummary[];
  locations: Pick<Location, "id" | "name">[];
  timeslots: Pick<Timeslot, "id" | "label" | "startTime">[];
  canManage?: boolean;
  photographerId?: number;
  loginHash?: string;
}) {
  const [confirmState, confirmAction] = useActionState(
    confirmApplicationAction,
    initialActionState,
  );
  const [revokeState, revokeAction] = useActionState(
    revokeApplicationAction,
    initialActionState,
  );
  const actionError = confirmState.error ?? revokeState.error ?? null;
  const [dismissedErrorKey, setDismissedErrorKey] = useState<string | null>(null);
  const errorKey = actionError ?? "";
  const alertMessage =
    actionError && dismissedErrorKey !== errorKey ? actionError : null;

  if (applications.length === 0) {
    return (
      <div className="empty-state">
        <p>Zatiaľ žiadne prihlášky.</p>
        <p className="empty-state-hint">
          Prihlášky sa tu zobrazia po odoslaní cez formulár rezervácií.
        </p>
      </div>
    );
  }

  return (
    <>
      <ActionAlertDialog
        message={alertMessage}
        onClose={() => setDismissedErrorKey(errorKey)}
      />
      <ul className="application-list">
      {applications.map((application) => (
        <li key={application.id} className="application-list-item">
          <div className="application-list-header">
            <strong>{application.cosplayerName}</strong>
            <span
              className={`placeholder-badge application-status application-status-${application.status}`}
            >
              {statusLabel(application.status)}
            </span>
          </div>
          <dl className="summary-list application-list-details">
            <div>
              <dt>Stanovište</dt>
              <dd>{application.locationName}</dd>
            </div>
            <div>
              <dt>Termín</dt>
              <dd>
                {formatTimeslot(
                  application.timeslotLabel,
                  application.timeslotStartTime,
                )}
              </dd>
            </div>
            <div>
              <dt>Odoslané</dt>
              <dd>{formatDate(application.createdAt)}</dd>
            </div>
          </dl>
          {canManage && photographerId && loginHash ? (
            <div className="application-list-actions">
              {application.status === "pending" ? (
                <form action={confirmAction} className="application-confirm-form">
                  <input
                    type="hidden"
                    name="applicationId"
                    value={application.id}
                  />
                  <input
                    type="hidden"
                    name="photographerId"
                    value={photographerId}
                  />
                  <input type="hidden" name="loginHash" value={loginHash} />
                  <label className="form-field">
                    <span>Stanovište</span>
                    <select
                      name="locationId"
                      required
                      defaultValue={String(application.locationId)}
                    >
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    <span>Termín</span>
                    <select
                      name="timeslotId"
                      required
                      defaultValue={String(application.timeslotId)}
                    >
                      {timeslots.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {formatTimeslot(slot.label, String(slot.startTime))}
                        </option>
                      ))}
                    </select>
                  </label>
                  <ActionButton
                    label="Potvrdiť prihlášku"
                    className="btn btn-primary"
                  />
                </form>
              ) : null}
              {application.status === "confirmed" ? (
                <form action={revokeAction}>
                  <input
                    type="hidden"
                    name="applicationId"
                    value={application.id}
                  />
                  <input
                    type="hidden"
                    name="photographerId"
                    value={photographerId}
                  />
                  <input type="hidden" name="loginHash" value={loginHash} />
                  <ActionButton
                    label="Zrušiť potvrdenie"
                    className="btn btn-secondary"
                  />
                </form>
              ) : null}
            </div>
          ) : null}
        </li>
      ))}
      </ul>
    </>
  );
}
