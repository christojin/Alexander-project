"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Twitter,
  Instagram,
  Mail,
  MapPin,
  Phone,
  MessageCircle,
  Send,
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
    title: "Categorias",
    links: [
      { label: "Streaming", href: "/products?category=streaming" },
      { label: "Gaming", href: "/products?category=gaming" },
      { label: "Gift Cards", href: "/products?category=gift-cards" },
      { label: "Software", href: "/products?category=software" },
      { label: "Mobile Top-Up", href: "/products?category=mobile-topup" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Inicio", href: "/" },
      { label: "Productos", href: "/products" },
      { label: "Iniciar Sesion", href: "/auth/login" },
      { label: "Registrarse", href: "/auth/register" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terminos de Servicio", href: "#" },
      { label: "Politica de Privacidad", href: "#" },
      { label: "Politica de Reembolso", href: "#" },
    ],
  },
];

// TikTok icon (lucide-react doesn't include one)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.98a8.2 8.2 0 0 0 4.76 1.52V7.05a4.84 4.84 0 0 1-1-.36z" />
    </svg>
  );
}

interface SiteSettings {
  siteName?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  whatsappUrl?: string;
  telegramUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactLocation?: string;
}

export default function Footer({ customHtml }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<SiteSettings>({});

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data: SiteSettings) => setSettings(data))
      .catch(console.error);
  }, []);

  // Build social links dynamically from settings
  const socialLinks = [
    { icon: Facebook, href: settings.facebookUrl, label: "Facebook" },
    { icon: Twitter, href: settings.twitterUrl, label: "Twitter" },
    { icon: Instagram, href: settings.instagramUrl, label: "Instagram" },
    { icon: TikTokIcon, href: settings.tiktokUrl, label: "TikTok" },
    { icon: MessageCircle, href: settings.whatsappUrl, label: "WhatsApp" },
    { icon: Send, href: settings.telegramUrl, label: "Telegram" },
  ].filter((s) => s.href);

  return (
    <footer className="bg-surface-900 text-surface-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Branding Section */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <Image
                src="/images/brand/logo-full.png"
                alt={settings.siteName ?? "VirtuMall"}
                width={160}
                height={40}
                className="h-9 w-auto brightness-0 invert"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-surface-400">
              Tu marketplace seguro de productos digitales en Bolivia
            </p>
            <div className="mt-6 space-y-3">
              {settings.contactEmail && (
                <div className="flex items-center gap-2.5 text-sm text-surface-400">
                  <Mail className="h-4 w-4 shrink-0 text-primary-400" />
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="transition-colors hover:text-white"
                  >
                    {settings.contactEmail}
                  </a>
                </div>
              )}
              {settings.contactPhone && (
                <div className="flex items-center gap-2.5 text-sm text-surface-400">
                  <Phone className="h-4 w-4 shrink-0 text-primary-400" />
                  <a
                    href={`tel:${settings.contactPhone}`}
                    className="transition-colors hover:text-white"
                  >
                    {settings.contactPhone}
                  </a>
                </div>
              )}
              {settings.contactLocation && (
                <div className="flex items-center gap-2.5 text-sm text-surface-400">
                  <MapPin className="h-4 w-4 shrink-0 text-primary-400" />
                  <span>{settings.contactLocation}</span>
                </div>
              )}
              {!settings.contactEmail && !settings.contactPhone && !settings.contactLocation && (
                <>
                  <div className="flex items-center gap-2.5 text-sm text-surface-400">
                    <Mail className="h-4 w-4 shrink-0 text-primary-400" />
                    <span>contacto@virtumall.com</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-surface-400">
                    <MapPin className="h-4 w-4 shrink-0 text-primary-400" />
                    <span>La Paz, Bolivia</span>
                  </div>
                </>
              )}
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
                  <li key={link.label}>
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
            &copy; {currentYear} {settings.siteName ?? "VirtuMall"}. Todos los derechos reservados.
          </p>

          {/* Social Media Links */}
          {socialLinks.length > 0 && (
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
          )}
        </div>
      </div>
    </footer>
  );
}
