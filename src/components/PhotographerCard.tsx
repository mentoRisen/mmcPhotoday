import Link from "next/link";
import type { Person } from "@/db/schema";
import PortfolioSlider from "./PortfolioSlider";

const socialFields = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "twitter", label: "Twitter" },
  { key: "website", label: "Web" },
] as const;

export default function PhotographerCard({
  photographer,
  detailHref,
}: {
  photographer: Person;
  detailHref?: string;
}) {
  const portfolioUrls = photographer.portfolioUrls ?? [];
  const socials = socialFields.filter(({ key }) => photographer[key]);

  const heading = <h3>{photographer.name}</h3>;
  const description = photographer.description ? (
    <p className="photographer-description">{photographer.description}</p>
  ) : null;

  const body = (
    <div className="photographer-body">
      {heading}
      {description}
      {detailHref ? (
        <span className="photographer-card-more">Profil →</span>
      ) : null}
    </div>
  );

  return (
    <article className="photographer-card">
      <PortfolioSlider urls={portfolioUrls} name={photographer.name} />
      {detailHref ? (
        <Link className="photographer-card-hit" href={detailHref}>
          {body}
        </Link>
      ) : (
        body
      )}
      {socials.length > 0 ? (
        <ul className="photographer-socials photographer-card-socials">
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
    </article>
  );
}
