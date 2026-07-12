"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type GalleryVariant = "portfolio" | "location";

const VARIANTS = {
  portfolio: {
    coverClassName: "photographer-cover",
    placeholderClassName: "photographer-cover placeholder",
    lightboxLabel: (name: string) => `Portfólio — ${name}`,
    galleryLabel: "Portfólio",
    imageAlt: (name: string, index: number) =>
      index === 0
        ? `Ukážka portfólia — ${name}`
        : `Portfólio ${name} — ${index + 1}`,
  },
  location: {
    coverClassName: "location-cover",
    placeholderClassName: "location-cover placeholder",
    lightboxLabel: (name: string) => `Galéria — ${name}`,
    galleryLabel: "Galéria stanovišťa",
    imageAlt: (name: string, index: number) =>
      index === 0
        ? `Ukážka stanovišťa — ${name}`
        : `Stanovište ${name} — ${index + 1}`,
  },
} as const;

function GalleryPlaceholder({ variant }: { variant: GalleryVariant }) {
  const { placeholderClassName } = VARIANTS[variant];

  return (
    <div className={placeholderClassName} aria-hidden="true">
      {variant === "location" ? (
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
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ) : (
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
      )}
    </div>
  );
}

function scrollTrackToIndex(track: HTMLElement, index: number, total: number) {
  const normalizedIndex = ((index % total) + total) % total;
  const slideWidth = track.clientWidth;
  const left = normalizedIndex * slideWidth;
  if (typeof track.scrollTo === "function") {
    track.scrollTo({ left, behavior: "smooth" });
  } else {
    track.scrollLeft = left;
  }
  return normalizedIndex;
}

export default function PortfolioSlider({
  urls,
  name,
  variant = "portfolio",
}: {
  urls: string[];
  name: string;
  variant?: GalleryVariant;
}) {
  const config = VARIANTS[variant];
  const trackRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  const lightboxTrackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track || urls.length === 0) return;
      setActiveIndex(scrollTrackToIndex(track, index, urls.length));
    },
    [urls.length],
  );

  const scrollLightboxToIndex = useCallback(
    (index: number) => {
      const track = lightboxTrackRef.current;
      if (!track || urls.length === 0) return;
      setLightboxIndex(scrollTrackToIndex(track, index, urls.length));
    },
    [urls.length],
  );

  const openLightbox = useCallback(
    (index: number) => {
      setLightboxIndex(index);
      lightboxRef.current?.showModal();
      requestAnimationFrame(() => {
        const track = lightboxTrackRef.current;
        if (track) {
          scrollTrackToIndex(track, index, urls.length);
        }
      });
    },
    [urls.length],
  );

  const closeLightbox = useCallback(() => {
    lightboxRef.current?.close();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || urls.length <= 1) return;

    const onScroll = () => {
      const slideWidth = track.clientWidth;
      if (slideWidth === 0) return;
      const index = Math.round(track.scrollLeft / slideWidth);
      setActiveIndex(Math.min(index, urls.length - 1));
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [urls.length]);

  useEffect(() => {
    const track = lightboxTrackRef.current;
    if (!track || urls.length <= 1 || lightboxIndex === null) return;

    const onScroll = () => {
      const slideWidth = track.clientWidth;
      if (slideWidth === 0) return;
      const index = Math.round(track.scrollLeft / slideWidth);
      setLightboxIndex(Math.min(index, urls.length - 1));
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [urls.length, lightboxIndex]);

  useEffect(() => {
    const dialog = lightboxRef.current;
    if (!dialog) return;

    const onClose = () => {
      if (lightboxIndex !== null) {
        scrollToIndex(lightboxIndex);
      }
      setLightboxIndex(null);
    };

    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [lightboxIndex, scrollToIndex]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollLightboxToIndex(lightboxIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollLightboxToIndex(lightboxIndex + 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, scrollLightboxToIndex]);

  const lightbox =
    urls.length > 0 ? (
      <dialog
        ref={lightboxRef}
        className="portfolio-lightbox"
        aria-label={config.lightboxLabel(name)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeLightbox();
          }
        }}
      >
        <div className="portfolio-lightbox-inner">
          <button
            type="button"
            className="portfolio-lightbox-close"
            aria-label="Zavrieť"
            onClick={closeLightbox}
          >
            ×
          </button>
          {lightboxIndex !== null && urls.length > 1 ? (
            <p className="portfolio-lightbox-counter" aria-live="polite">
              {lightboxIndex + 1} / {urls.length}
            </p>
          ) : null}
          <div ref={lightboxTrackRef} className="portfolio-lightbox-track">
            {urls.map((url, index) => (
              // eslint-disable-next-line @next/next/no-img-element -- catalog URLs are arbitrary import-produced locations, not next/image candidates
              <img
                key={url}
                className="portfolio-lightbox-slide"
                src={url}
                alt={config.imageAlt(name, index)}
                aria-hidden={lightboxIndex !== null && index !== lightboxIndex}
              />
            ))}
          </div>
          {urls.length > 1 ? (
            <>
              <button
                type="button"
                className="portfolio-lightbox-nav portfolio-lightbox-prev"
                aria-label="Predchádzajúca fotografia"
                onClick={() =>
                  scrollLightboxToIndex(
                    lightboxIndex === null ? 0 : lightboxIndex - 1,
                  )
                }
              >
                ‹
              </button>
              <button
                type="button"
                className="portfolio-lightbox-nav portfolio-lightbox-next"
                aria-label="Ďalšia fotografia"
                onClick={() =>
                  scrollLightboxToIndex(
                    lightboxIndex === null ? 0 : lightboxIndex + 1,
                  )
                }
              >
                ›
              </button>
            </>
          ) : null}
        </div>
      </dialog>
    ) : null;

  if (urls.length === 0) {
    return <GalleryPlaceholder variant={variant} />;
  }

  if (urls.length === 1) {
    return (
      <>
        <button
          type="button"
          className="portfolio-slide-open"
          aria-label={`Zväčšiť: ${config.imageAlt(name, 0)}`}
          onClick={() => openLightbox(0)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- catalog URLs are arbitrary import-produced locations, not next/image candidates */}
          <img
            className={config.coverClassName}
            src={urls[0]}
            alt={config.imageAlt(name, 0)}
          />
        </button>
        {lightbox}
      </>
    );
  }

  return (
    <>
      <div className="portfolio-slider">
        <div
          ref={trackRef}
          className="portfolio-slider-track"
          aria-live="polite"
        >
          {urls.map((url, index) => (
            <button
              key={url}
              type="button"
              className="portfolio-slide-open portfolio-slider-slide"
              aria-label={`Zväčšiť: ${config.imageAlt(name, index)}`}
              onClick={() => openLightbox(index)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- catalog URLs are arbitrary import-produced locations, not next/image candidates */}
              <img
                className={config.coverClassName}
                src={url}
                alt={config.imageAlt(name, index)}
                aria-hidden={index !== activeIndex}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          className="portfolio-slider-nav portfolio-slider-prev"
          aria-label="Predchádzajúca fotografia"
          onClick={() => scrollToIndex(activeIndex - 1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="portfolio-slider-nav portfolio-slider-next"
          aria-label="Ďalšia fotografia"
          onClick={() => scrollToIndex(activeIndex + 1)}
        >
          ›
        </button>
        <div
          className="portfolio-slider-dots"
          role="tablist"
          aria-label={config.galleryLabel}
        >
          {urls.map((url, index) => (
            <button
              key={url}
              type="button"
              role="tab"
              className="portfolio-slider-dot"
              aria-selected={index === activeIndex}
              aria-label={`Fotografia ${index + 1}`}
              onClick={() => scrollToIndex(index)}
            />
          ))}
        </div>
      </div>
      {lightbox}
    </>
  );
}
