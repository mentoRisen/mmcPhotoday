import Link from "next/link";

const links = [
  { href: "/", label: "Domov" },
  { href: "/bookings", label: "Rezervácie" },
  { href: "/sessions", label: "Termíny" },
  { href: "/notifications", label: "Notifikácie" },
];

export default function SiteNav() {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Hlavná navigácia">
        <Link href="/" className="site-brand">
          MMC <span>Photoday</span>
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
