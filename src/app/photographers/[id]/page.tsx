import type { Metadata } from "next";
import Link from "next/link";
import PhotographerApplicationList from "@/components/PhotographerApplicationList";
import PhotographerProfile from "@/components/PhotographerProfile";
import ActionErrorFromUrl from "@/components/ActionErrorFromUrl";
import { actionErrorMessage } from "@/app/photographers/[id]/action-errors";
import { listApplicationsForPhotographer } from "@/db/applications";
import { listLocations } from "@/db/locations";
import {
  getPhotographerById,
  isPhotographerLoginValid,
} from "@/db/photographers";
import { listBookableTimeslots } from "@/db/timeslots";

export const dynamic = "force-dynamic";

type PhotographerDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ loginHash?: string; actionError?: string }>;
};

export async function generateMetadata({
  params,
}: PhotographerDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const photographerId = Number.parseInt(id, 10);
  const photographer =
    Number.isFinite(photographerId) && photographerId > 0
      ? await getPhotographerById(photographerId)
      : null;

  if (!photographer) {
    return { title: "Fotograf nenájdený — MMC Photoday" };
  }

  return { title: `${photographer.name} — MMC Photoday` };
}

export default async function PhotographerDetailPage({
  params,
  searchParams,
}: PhotographerDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const photographerId = Number.parseInt(id, 10);
  const loginHash = query.loginHash?.trim() ?? "";
  const actionError = actionErrorMessage(query.actionError);

  if (!Number.isFinite(photographerId) || photographerId <= 0) {
    return (
      <section>
        <h1 className="page-title">Fotograf nenájdený</h1>
        <p className="page-lead">
          Tento profil sa nepodarilo nájsť. Skontroluj odkaz alebo sa vráť na
          zoznam fotografov.
        </p>
        <Link className="back-link" href="/photographers">
          ← Späť na zoznam fotografov
        </Link>
      </section>
    );
  }

  const photographer = await getPhotographerById(photographerId);

  if (!photographer) {
    return (
      <section>
        <h1 className="page-title">Fotograf nenájdený</h1>
        <p className="page-lead">
          Tento profil sa nepodarilo nájsť. Skontroluj odkaz alebo sa vráť na
          zoznam fotografov.
        </p>
        <Link className="back-link" href="/photographers">
          ← Späť na zoznam fotografov
        </Link>
      </section>
    );
  }

  const canManage =
    loginHash.length > 0 &&
    (await isPhotographerLoginValid(photographer.id, loginHash));
  const [applications, locations, timeslots] = await Promise.all([
    listApplicationsForPhotographer(photographer.id),
    listLocations(),
    listBookableTimeslots(),
  ]);

  return (
    <section>
      <Link className="back-link" href="/photographers">
        ← Späť na zoznam fotografov
      </Link>

      <h1 className="page-title">{photographer.name}</h1>
      <p className="page-lead">Profil fotografa a prehľad prihlášok na fotenie.</p>

      {canManage ? (
        <p className="photographer-auth-banner">
          Si prihlásený ako fotograf — môžeš potvrdzovať alebo rušiť prihlášky.
        </p>
      ) : null}

      {canManage && actionError && loginHash ? (
        <ActionErrorFromUrl
          message={actionError}
          photographerId={photographer.id}
          loginHash={loginHash}
        />
      ) : null}

      <PhotographerProfile photographer={photographer} />

      <div className="detail-section">
        <div className="detail-section-header">
          <div>
            <h2 className="detail-section-title">Prihlášky</h2>
            <p className="detail-section-ad">
              Chceš sa odfotiť u {photographer.name}? Pošli prihlášku cez
              formulár rezervácií.
            </p>
          </div>
          <Link
            className="btn btn-primary detail-section-cta"
            href={`/bookings?photographerId=${photographer.id}`}
          >
            Rezervovať fotenie
          </Link>
        </div>
        <PhotographerApplicationList
          applications={applications}
          locations={locations}
          timeslots={timeslots}
          canManage={canManage}
          photographerId={photographer.id}
          loginHash={canManage ? loginHash : undefined}
        />
      </div>
    </section>
  );
}
