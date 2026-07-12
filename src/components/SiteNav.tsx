import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/", label: "Domov" },
  { href: "/locations", label: "Fotostanovištia" },
  { href: "/photographers", label: "Fotografi" },
  { href: "/sessions", label: "Termíny" },
  { href: "/bookings", label: "Rezervovať fotenie" },
];

export default function SiteNav() {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Hlavná navigácia">
        <Link href="/" className="site-brand">
          <Image
            src="/brand/mmc-logo.jpg"
            alt="Mini Movie Con"
            width={61}
            height={61}
            className="site-brand-logo"
            priority
          />
          <span className="site-brand-label">
            MMC <span>Photoday</span>
          </span>
        </Link>
        <ul className="site-nav-links">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>{link.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
