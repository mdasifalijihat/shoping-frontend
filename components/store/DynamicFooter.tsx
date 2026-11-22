"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { getPublicPageLinks } from "@/app/services/siteSetting.service";
import {
  object,
  setting,
  settingsQuery,
  string,
} from "@/components/store/store-data";
import { StoreLink } from "@/components/store/store-ui";

export function DynamicFooter() {
  const settings = useQuery(settingsQuery);
  const pages = useQuery({
    queryKey: ["store", "pages"],
    queryFn: getPublicPageLinks,
  });
  const general = object(setting(settings.data, "GENERAL_INFO"));
  const footer = object(setting(settings.data, "FOOTER_LINKS"));
  const social = setting(settings.data, "SOCIAL_LINKS");
  const links = Array.isArray(social) ? social : object(social).links;
  const socials = Array.isArray(links)
    ? links.flatMap((item) => {
        const value = object(item);
        const name = string(value.platform);
        const url = string(value.url);
        return name && url ? [{ name, url }] : [];
      })
    : [];
  const name = string(general.siteName) || "Store";
  const email = string(general.contactEmail);
  const phone = string(general.phone);
  const address = string(general.address);
  const description = string(footer.description);
  const copyright = string(footer.copyrightText);
  const customPages = pages.data ?? [];
  return (
    <footer className="mt-auto border-t bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:py-14">
        <div className="space-y-3">
          <Link href="/" className="font-heading text-xl font-semibold">
            {name}
          </Link>
          {description && (
            <p className="max-w-sm whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
          {socials.length > 0 && (
            <ul aria-label="Social links" className="flex flex-wrap gap-2">
              {socials.map(({ name, url }, index) => (
                <li key={`${name}-${index}`}>
                  <StoreLink
                    href={url}
                    openInNew
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium hover:bg-background"
                  >
                    {name}
                    <ArrowUpRight className="size-3" />
                  </StoreLink>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">Store information</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link
                href="/track-order"
                className="hover:text-foreground hover:underline"
              >
                Track an order
              </Link>
            </li>
            {customPages.map((page) => (
              <li key={page.id}>
                <Link
                  className="hover:text-foreground hover:underline"
                  href={`/page/${encodeURIComponent(page.slug)}`}
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {(email || phone || address) && (
          <div>
            <h2 className="mb-3 text-sm font-semibold">Contact</h2>
            <address className="space-y-2 text-sm text-muted-foreground not-italic">
              {email && (
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 size-4 shrink-0" />
                  <StoreLink
                    href={`mailto:${email}`}
                    className="break-all hover:underline"
                  >
                    {email}
                  </StoreLink>
                </div>
              )}
              {phone && (
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 size-4 shrink-0" />
                  <StoreLink
                    href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                    className="hover:underline"
                  >
                    {phone}
                  </StoreLink>
                </div>
              )}
              {address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span className="whitespace-pre-line">{address}</span>
                </div>
              )}
            </address>
          </div>
        )}
      </div>
      {copyright && (
        <div className="border-t px-4 py-4 text-center text-xs text-muted-foreground">
          {copyright}
        </div>
      )}
    </footer>
  );
}
