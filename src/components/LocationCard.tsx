import type { Location } from "@/db/schema";
import PortfolioSlider from "./PortfolioSlider";

function mapsUrl(latitude: string, longitude: string): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export default function LocationCard({ location }: { location: Location }) {
  const previewUrls = location.previewGalleryUrls ?? [];
  const hasCoordinates = location.latitude && location.longitude;

  return (
    <article className="location-card">
      <PortfolioSlider
        urls={previewUrls}
        name={location.name}
        variant="location"
      />
      <div className="location-body">
        <h3>{location.name}</h3>
        {location.description ? (
          <p className="location-description">{location.description}</p>
        ) : null}
        {location.address || hasCoordinates ? (
          <div className="location-meta">
            {location.address ? (
              <p className="location-address">{location.address}</p>
            ) : null}
            {hasCoordinates ? (
              <a
                className="location-map-link"
                href={mapsUrl(location.latitude!, location.longitude!)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Mapa
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
