import Link from "next/link";
import {
  Shield,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
} from "lucide-react";

interface FooterProps {
  customHtml?: string;
}

interface FooterLinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

const linkGroups: FooterLinkGroup[] = [
  {
    title: "Productos",
    links: [
      { label: "Software", href: "/categorias/software" },
      { label: "Cursos Online", href: "/categorias/cursos" },
      { label: "E-books", href: "/categorias/ebooks" },
      { label: "Plantillas", href: "/categorias/plantillas" },
      { label: "Recursos Graficos", href: "/categorias/graficos" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre Nosotros", href: "/sobre-nosotros" },
      { label: "Contacto", href: "/contacto" },
      { label: "Preguntas Frecuentes", href: "/faq" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terminos de Servicio", href: "/terminos" },
      { label: "Politica de Privacidad", href: "/privacidad" },
      { label: "Politica de Reembolso", href: "/reembolsos" },
    ],
  },
];

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
];

export default function Footer({ customHtml }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-900 text-surface-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Branding Section */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white transition-colors group-hover:bg-primary-500">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-white">
                Vendor<span className="text-primary-400">Vault</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-surface-400">
              Tu marketplace seguro de productos digitales en Bolivia
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-surface-400">
                <Mail className="h-4 w-4 shrink-0 text-primary-400" />
                <a
                  href="mailto:contacto@vendorvault.bo"
                  className="transition-colors hover:text-white"
                >
                  contacto@vendorvault.bo
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-surface-400">
                <MapPin className="h-4 w-4 shrink-0 text-primary-400" />
                <span>La Paz, Bolivia</span>
              </div>
            </div>
          </div>

          {/* Link Groups */}
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-surface-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Custom HTML Section (admin customization) */}
        {customHtml && (
          <div
            className="border-t border-surface-800 py-6"
            dangerouslySetInnerHTML={{ __html: customHtml }}
          />
        )}

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-surface-800 py-6 sm:flex-row">
          <p className="text-sm text-surface-500">
            &copy; {currentYear} VendorVault. Todos los derechos reservados.
          </p>

          {/* Social Media Links */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-800 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
