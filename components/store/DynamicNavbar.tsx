"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { getPublicNavbar } from "@/app/services/navbar.service";
import { useCartStore } from "@/app/store/useCartStore";
import type { INavbarItem } from "@/app/types/navbar.types";
import {
  object,
  setting,
  settingsQuery,
  string,
} from "@/components/store/store-data";
import { StoreImage, StoreLink } from "@/components/store/store-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";

export function DynamicNavbar() {
  const settings = useQuery(settingsQuery);
  const menu = useQuery({
    queryKey: ["store", "navbar"],
    queryFn: getPublicNavbar,
  });
  const branding = object(setting(settings.data, "GENERAL_INFO"));
  const notice = object(setting(settings.data, "HEADER_NOTICE"));
  const name = string(branding.siteName) || "Store";
  const logo = string(branding.logoUrl);
  const noticeText = string(notice.text);
  const noticeActive =
    typeof notice.isActive === "boolean"
      ? notice.isActive
      : notice.enabled === true;
  const session = authClient.useSession();
  const user = session.data?.user;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const accountHref = isAdmin ? "/admin" : user ? "/account" : "/login";
  const accountLabel = isAdmin
    ? "Admin Dashboard"
    : user
      ? "Account"
      : "Log in";
  const count = useCartStore((state) => state.totalItems());
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const items = (menu.data ?? []).filter((item) => item.isActive);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = String(
      new FormData(event.currentTarget).get("searchTerm") ?? "",
    ).trim();
    router.push(
      term
        ? `/products?${new URLSearchParams({ searchTerm: term })}`
        : "/products",
    );
  }

  return (
    <header className="relative z-30 border-b bg-background">
      {noticeActive && noticeText && (
        <div className="bg-emerald-950 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
          {string(notice.link) ? (
            <StoreLink
              href={string(notice.link)}
              className="underline-offset-4 hover:underline"
            >
              {noticeText}
            </StoreLink>
          ) : (
            noticeText
          )}
        </div>
      )}
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-3 sm:px-6 lg:grid-cols-[auto_minmax(14rem,1fr)_auto] lg:gap-x-10 lg:py-5">
        <div className="flex min-w-0 items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                />
              }
              aria-label="Open store navigation"
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{name}</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile store navigation" className="px-4 pb-5">
                <Link
                  href="/products"
                  className="block rounded-lg px-3 py-2 font-medium hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  All products
                </Link>
                <NavigationTree
                  items={items}
                  onNavigate={() => setOpen(false)}
                />
              </nav>
            </SheetContent>
          </Sheet>
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 font-heading text-lg font-semibold tracking-tight sm:text-2xl"
          >
            {logo && (
              <StoreImage
                src={logo}
                alt=""
                sizes="40px"
                className="size-9 shrink-0 rounded-md bg-transparent"
                fit="contain"
              />
            )}
            <span className="truncate">{name}</span>
          </Link>
        </div>
        <form
          role="search"
          action="/products"
          onSubmit={search}
          className="col-span-2 row-start-2 mx-auto flex w-full max-w-2xl items-center gap-1 rounded-full border bg-muted/45 pl-2 pr-1 lg:col-span-1 lg:col-start-2 lg:row-start-1"
        >
          <Input
            name="searchTerm"
            type="search"
            aria-label="Search products"
            placeholder="Search products"
            className="h-10 rounded-full border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="shrink-0 rounded-full"
            aria-label="Search"
          >
            <Search />
          </Button>
        </form>
        <div className="col-start-2 row-start-1 flex items-center gap-1 sm:gap-3 lg:col-start-3">
          <Link
            href={accountHref}
            aria-label={accountLabel}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium hover:bg-muted"
          >
            <UserRound className="size-5" aria-hidden="true" />
            <span className="hidden sm:inline">{accountLabel}</span>
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium hover:bg-muted"
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            <span className="hidden sm:inline">Cart</span>
            <span
              aria-hidden="true"
              className="min-w-5 rounded-full bg-emerald-900 px-1.5 text-center text-xs leading-5 text-white"
            >
              {count}
            </span>
          </Link>
        </div>
      </div>
      <nav aria-label="Store navigation" className="hidden border-t lg:block">
        <ul className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 px-6">
          <li>
            <Link
              href="/products"
              className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
            >
              All products
            </Link>
          </li>
          {items.map((item) => (
            <DesktopMenu key={item.id} item={item} />
          ))}
        </ul>
      </nav>
    </header>
  );
}

function DesktopMenu({ item }: { item: INavbarItem }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const children = (item.children ?? []).filter((child) => child.isActive);
  const buttonClass =
    "rounded-lg px-2 py-2.5 text-sm font-medium hover:bg-muted";

  return (
    <li
      className="relative"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setOpen(true);
      }}
      onPointerLeave={(event) => {
        if (
          event.pointerType === "mouse" &&
          !event.currentTarget.contains(document.activeElement)
        )
          setOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          event.currentTarget
            .querySelector<HTMLButtonElement>("button")
            ?.focus();
        }
      }}
    >
      <div className="flex items-center">
        {item.url && (
          <StoreLink
            href={item.url}
            openInNew={item.openInNew}
            className={buttonClass}
            onClick={() => setOpen(false)}
          >
            {item.title}
          </StoreLink>
        )}
        {children.length > 0 ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            aria-label={item.url ? `${item.title} submenu` : undefined}
            className={`flex items-center gap-1 ${buttonClass}`}
            onClick={() => setOpen(!open)}
          >
            {!item.url && item.title}
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
        ) : (
          !item.url && <span className={buttonClass}>{item.title}</span>
        )}
      </div>
      {open && children.length > 0 && (
        <div
          id={id}
          className="absolute top-full left-0 z-40 w-64 rounded-b-xl border bg-popover p-2 shadow-lg"
        >
          <NavigationTree items={children} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </li>
  );
}

function NavigationTree({
  items,
  onNavigate,
}: {
  items: INavbarItem[];
  onNavigate: () => void;
}) {
  return (
    <ul className="space-y-0.5 text-sm">
      {items
        .filter((item) => item.isActive)
        .map((item) => {
          const children = (item.children ?? []).filter(
            (entry) => entry.isActive,
          );
          const link = "block break-words rounded-lg px-3 py-2 hover:bg-muted";
          return (
            <li key={item.id}>
              {children.length ? (
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 font-medium hover:bg-muted">
                    {item.title}
                    <ChevronDown
                      className="size-4 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="ml-2 border-l pl-2">
                    {item.url && (
                      <StoreLink
                        href={item.url}
                        className={link}
                        openInNew={item.openInNew}
                        onClick={onNavigate}
                      >
                        View {item.title}
                      </StoreLink>
                    )}
                    <NavigationTree items={children} onNavigate={onNavigate} />
                  </div>
                </details>
              ) : item.url ? (
                <StoreLink
                  href={item.url}
                  className={link}
                  openInNew={item.openInNew}
                  onClick={onNavigate}
                >
                  {item.title}
                </StoreLink>
              ) : (
                <span className={link}>{item.title}</span>
              )}
            </li>
          );
        })}
    </ul>
  );
}
