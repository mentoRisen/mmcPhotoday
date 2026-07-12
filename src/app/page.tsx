import Image from "next/image";
import Link from "next/link";

const features: {
  title: string;
  body: string;
  link?: { href: string; label: string };
}[] = [
  {
    title: "Fotostanovištia",
    body: "Viac lokácií na fotenie, každá s vlastným rozvrhom.",
    link: { href: "/locations", label: "Spoznať stanovištia" },
  },
  {
    title: "Fotografi",
    body: "Viacerí fotografi s vlastnými voľnými termínmi.",
    link: { href: "/photographers", label: "Spoznať fotografov" },
  },
  {
    title: "Cosplayeri",
    body: "Cosplayeri si vyberú stanovište, čas aj fotografa a rezervujú fotenie.",
    link: { href: "/bookings", label: "Rezervovať fotenie" },
  },
  {
    title: "Bez kolízií",
    body: "Jeden termín = jeden fotograf a jeden cosplayer na stanovišti.",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero hero-branded">
        <div className="hero-inner">
          <Image
            src="/brand/mmc-wordmark.png"
            alt=""
            aria-hidden="true"
            width={640}
            height={123}
            className="hero-wordmark"
            priority
          />
          <h1>Photoday</h1>
          <p className="hero-lead">
            Centrálne miesto pre fotenie na konvencii. Koordinuje fotografov,
            fotostanovištia, cosplayerov a časové okná tak, aby sa termíny
            neprekrývali.
          </p>
          <div className="cta-row">
            <Link href="/bookings" className="cta primary">
              Rezervovať fotenie
            </Link>
            <Link href="/sessions" className="cta secondary">
              Zobraziť termíny
            </Link>
          </div>
        </div>
      </section>

      <section className="feature-grid" aria-label="Ako to funguje">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
            {feature.link ? (
              <Link href={feature.link.href} className="feature-card-link">
                {feature.link.label}
              </Link>
            ) : null}
          </article>
        ))}
      </section>
    </>
  );
}
