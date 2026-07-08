import type { Person } from "@/db/schema";

const socialFields = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "twitter", label: "Twitter" },
  { key: "website", label: "Web" },
] as const;

export default function PhotographerCard({
  photographer,
}: {
  photographer: Person;
}) {
  const coverUrl = photographer.portfolioUrls?.[0];
  const socials = socialFields.filter(({ key }) => photographer[key]);

  return (
    <article className="photographer-card">
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- catalog URLs are arbitrary import-produced locations, not next/image candidates
        <img
          className="photographer-cover"
          src={coverUrl}
          alt={`Ukážka portfólia — ${photographer.name}`}
        />
      ) : (
        <div className="photographer-cover placeholder" aria-hidden="true">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
      )}
      <div className="photographer-body">
        <h3>{photographer.name}</h3>
        {photographer.description ? (
          <p className="photographer-description">{photographer.description}</p>
        ) : null}
        {socials.length > 0 ? (
          <ul className="photographer-socials">
            {socials.map(({ key, label }) => (
              <li key={key}>
                <a
                  href={photographer[key]!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
