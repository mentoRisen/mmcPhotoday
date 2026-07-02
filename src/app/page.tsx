import Link from "next/link";

const features = [
  {
    title: "Fotostanovištia",
    body: "Viac lokácií na fotenie, každá s vlastným rozvrhom.",
  },
  {
    title: "Fotografi",
    body: "Viacerí fotografi s vlastnými voľnými termínmi.",
  },
  {
    title: "Cosplayeri",
    body: "Cosplayeri si vyberú stanovište, čas aj fotografa.",
  },
  {
    title: "Bez kolízií",
    body: "Jeden termín = jeden fotograf a jeden cosplayer na stanovišti.",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>
          Photoday na <span className="accent">Mini Movie Con</span>
        </h1>
        <p>
          Centrálne miesto pre fotenie na konvencii. Koordinuje fotografov,
          fotostanovištia, cosplayerov a časové okná tak, aby sa termíny
          neprekrývali.
        </p>
        <div className="cta-row">
          <Link href="/bookings" className="cta primary">
            Rezervovať fotenie
          </Link>
          <Link href="/sessions" className="cta">
            Zobraziť termíny
          </Link>
        </div>
      </section>

      <section className="feature-grid" aria-label="Ako to funguje">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>
    </>
  );
}
