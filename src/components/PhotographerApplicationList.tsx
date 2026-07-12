"use client";

import { useFormStatus } from "react-dom";
import type { PhotographerApplicationSummary } from "@/db/applications";
import {
  confirmApplicationAction,
  revokeApplicationAction,
} from "@/app/photographers/[id]/actions";

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
  canManage = false,
  photographerId,
  loginHash,
}: {
  applications: PhotographerApplicationSummary[];
  canManage?: boolean;
  photographerId?: number;
  loginHash?: string;
}) {
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
                <form action={confirmApplicationAction}>
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
                    label="Potvrdiť prihlášku"
                    className="btn btn-primary"
                  />
                </form>
              ) : null}
              {application.status === "confirmed" ? (
                <form action={revokeApplicationAction}>
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
  );
}
