"use client";

import { useActionState } from "react";
import {
  submitPhotographerRegistration,
  type SubmitPhotographerRegistrationState,
} from "@/app/photographers/actions";

const initialState: SubmitPhotographerRegistrationState = {};

export default function PhotographerRegistrationForm() {
  const [state, submitAction, isPending] = useActionState(
    submitPhotographerRegistration,
    initialState,
  );

  if (state.success) {
    return (
      <div className="form-success">
        <p>
          Ďakujeme! Tvoja registrácia bola odoslaná organizátorom. Ozveme sa ti
          po posúdení prihlášky.
        </p>
      </div>
    );
  }

  return (
    <form action={submitAction} className="application-form">
      <fieldset className="form-section">
        <legend className="form-section-title">Kontaktné údaje</legend>
        <label className="form-field">
          <span>Meno</span>
          <input type="text" name="name" required autoComplete="name" />
        </label>
        <label className="form-field">
          <span>E-mail</span>
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label className="form-field">
          <span>Popis / štýl fotenia</span>
          <textarea name="description" rows={3} />
        </label>
        <label className="form-field">
          <span>Správa pre organizátora</span>
          <textarea
            name="message"
            rows={3}
            placeholder="Napr. odkaz na portfólio alebo skúsenosti s cosplay fotením"
          />
        </label>
      </fieldset>

      <fieldset className="form-section">
        <legend className="form-section-title">Sociálne siete a web</legend>
        <p className="form-hint">Voliteľné — pomôže organizátorovi posúdiť tvoju prácu.</p>
        <label className="form-field">
          <span>Instagram</span>
          <input type="url" name="instagram" placeholder="https://instagram.com/..." />
        </label>
        <label className="form-field">
          <span>Facebook</span>
          <input type="url" name="facebook" placeholder="https://facebook.com/..." />
        </label>
        <label className="form-field">
          <span>Twitter / X</span>
          <input type="url" name="twitter" placeholder="https://x.com/..." />
        </label>
        <label className="form-field">
          <span>Web</span>
          <input type="url" name="website" placeholder="https://..." />
        </label>
      </fieldset>

      {state.error ? <p className="form-error">{state.error}</p> : null}

      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? "Odosielam…" : "Odoslať registráciu"}
      </button>
    </form>
  );
}
