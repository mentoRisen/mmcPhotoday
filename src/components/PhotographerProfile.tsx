import type { Person } from "@/db/schema";
import PortfolioSlider from "./PortfolioSlider";

const socialFields = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "twitter", label: "Twitter" },
  { key: "website", label: "Web" },
] as const;

export default function PhotographerProfile({
  photographer,
}: {
  photographer: Person;
}) {
  const portfolioUrls = photographer.portfolioUrls ?? [];
  const socials = socialFields.filter(({ key }) => photographer[key]);

  return (
    <div className="photographer-profile">
      <PortfolioSlider urls={portfolioUrls} name={photographer.name} />
      <div className="photographer-profile-body">
        {photographer.description ? (
          <p className="photographer-description-full">{photographer.description}</p>
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
    </div>
  );
}
