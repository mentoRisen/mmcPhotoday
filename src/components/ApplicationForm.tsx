"use client";

import { useActionState, useState, useTransition } from "react";
import type { Person, Location, Timeslot } from "@/db/schema";
import type { LocationTimeslotKey } from "@/db/applications";
import {
  lookupCosplayerByEmail,
  submitApplication,
  type SubmitApplicationState,
} from "@/app/bookings/actions";

type ApplicationFormProps = {
  photographers: Person[];
  locations: Location[];
  timeslots: Timeslot[];
  confirmedKeys: LocationTimeslotKey[];
  defaultPhotographerId?: number;
};

function resolveDefaultPhotographerId(
  photographers: Person[],
  defaultPhotographerId?: number,
): string {
  if (
    defaultPhotographerId &&
    photographers.some((photographer) => photographer.id === defaultPhotographerId)
  ) {
    return String(defaultPhotographerId);
  }

  return "";
}

function isSlotBlocked(
  locationId: number,
  timeslotId: number,
  confirmedKeys: LocationTimeslotKey[],
): boolean {
  return confirmedKeys.some(
    (key) => key.locationId === locationId && key.timeslotId === timeslotId,
  );
}

const initialSubmitState: SubmitApplicationState = {};

export default function ApplicationForm({
  photographers,
  locations,
  timeslots,
  confirmedKeys,
  defaultPhotographerId,
}: ApplicationFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [returning, setReturning] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookupPending, startLookupTransition] = useTransition();
  const [submitState, submitAction, isSubmitPending] = useActionState(
    submitApplication,
    initialSubmitState,
  );

  const [photographerId, setPhotographerId] = useState(() =>
    resolveDefaultPhotographerId(photographers, defaultPhotographerId),
  );
  const [locationId, setLocationId] = useState("");
  const [timeslotId, setTimeslotId] = useState("");

  const selectedLocationId = Number(locationId);
  const selectedTimeslotId = Number(timeslotId);
  const selectionBlocked =
    locationId &&
    timeslotId &&
    isSlotBlocked(selectedLocationId, selectedTimeslotId, confirmedKeys);

  function runEmailLookup(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    setLookupError(null);
    startLookupTransition(async () => {
      try {
        const result = await lookupCosplayerByEmail(trimmed);
        if ("error" in result) {
          setLookupError(result.error ?? null);
          setReturning(false);
          return;
        }
        if (result.found) {
          setReturning(true);
          setName(result.name);
        } else {
          setReturning(false);
        }
      } catch {
        setLookupError(
          "Nepodarilo sa overiť e-mail. Skús to znova alebo vyplň meno ručne.",
        );
        setReturning(false);
      }
    });
  }

  return (
    <form action={submitAction} className="application-form">
      <fieldset className="form-section">
        <legend className="form-section-title">1. Tvoja identita</legend>
        <label className="form-field">
          <span>E-mail</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setReturning(false);
              setLookupError(null);
            }}
            onBlur={(event) => runEmailLookup(event.target.value)}
          />
        </label>
        {isLookupPending ? (
          <p className="form-hint">Overujem e-mail…</p>
        ) : (
          <p className="form-hint">
            Po opustení poľa overíme, či už máš profil — meno sa doplní
            automaticky.
          </p>
        )}
        {lookupError ? <p className="form-error">{lookupError}</p> : null}
        {returning ? (
          <p className="form-hint">Vitaj späť! Tvoje meno z poslednej prihlášky:</p>
        ) : null}
        <label className="form-field">
          <span>Meno</span>
          <input
            type="text"
            name="name"
            required
            value={name}
            readOnly={returning}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
      </fieldset>

      <fieldset className="form-section">
        <legend className="form-section-title">2. Výber fotenia</legend>
        <label className="form-field">
          <span>Fotograf</span>
          <select
            name="photographerId"
            required
            value={photographerId}
            onChange={(event) => setPhotographerId(event.target.value)}
          >
            <option value="">Vyber fotografa</option>
            {photographers.map((photographer) => (
              <option key={photographer.id} value={photographer.id}>
                {photographer.name}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Fotostanovište</span>
          <select
            name="locationId"
            required
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
          >
            <option value="">Vyber stanovište</option>
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
            value={timeslotId}
            onChange={(event) => setTimeslotId(event.target.value)}
          >
            <option value="">Vyber termín</option>
            {timeslots.map((slot) => {
              const blocked =
                locationId &&
                isSlotBlocked(Number(locationId), slot.id, confirmedKeys);
              return (
                <option
                  key={slot.id}
                  value={slot.id}
                  disabled={Boolean(blocked)}
                >
                  {slot.label}
                  {slot.startTime ? ` (${String(slot.startTime).slice(0, 5)})` : ""}
                  {blocked ? " — obsadené" : ""}
                </option>
              );
            })}
          </select>
        </label>

        {selectionBlocked ? (
          <p className="form-error">
            Toto stanovište a termín sú už obsadené potvrdenou rezerváciou.
          </p>
        ) : null}
      </fieldset>

      {submitState.error ? <p className="form-error">{submitState.error}</p> : null}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={isSubmitPending || Boolean(selectionBlocked)}
      >
        {isSubmitPending ? "Odosielam…" : "Odoslať prihlášku"}
      </button>
    </form>
  );
}
