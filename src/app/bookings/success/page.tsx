import type { Metadata } from "next";
import { getApplicationById } from "@/db/applications";

export const metadata: Metadata = {
  title: "Prihláška odoslaná — MMC Photoday",
};

export const dynamic = "force-dynamic";

type SuccessPageProps = {
  searchParams: Promise<{ applicationId?: string }>;
};

export default async function BookingSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const applicationId = Number.parseInt(params.applicationId ?? "", 10);
  const application =
    Number.isFinite(applicationId) && applicationId > 0
      ? await getApplicationById(applicationId)
      : null;

  if (!application) {
    return (
      <section>
        <h1 className="page-title">Prihláška nenájdená</h1>
        <p className="page-lead">
          Túto prihlášku sa nepodarilo nájsť. Skontroluj odkaz alebo odošli novú
          prihlášku.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1 className="page-title">Prihláška prijatá</h1>
      <p className="page-lead">
        Tvoja prihláška čaká na schválenie organizátorom. Potvrdenie sme poslali
        aj na e-mail {application.cosplayerEmail}.
      </p>

      <div className="summary-card">
        <span className="placeholder-badge">Čaká na schválenie</span>
        <dl className="summary-list">
          <div>
            <dt>Cosplayer</dt>
            <dd>{application.cosplayerName}</dd>
          </div>
          <div>
            <dt>Fotograf</dt>
            <dd>{application.photographerName}</dd>
          </div>
          <div>
            <dt>Stanovište</dt>
            <dd>{application.locationName}</dd>
          </div>
          <div>
            <dt>Termín</dt>
            <dd>
              {application.timeslotLabel}
              {application.timeslotStartTime
                ? ` (${application.timeslotStartTime.slice(0, 5)})`
                : ""}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
