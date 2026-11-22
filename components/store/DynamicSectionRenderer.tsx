"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { getPublicCategories } from "@/app/services/category.service";
import { getPublicProducts } from "@/app/services/product.service";
import type { JsonObject, JsonValue } from "@/app/types/api.types";
import type { IHomepageSection } from "@/app/types/navbar.types";
import { ProductGrid } from "@/components/store/ProductCard";
import { RichText } from "@/components/store/RichText";
import {
  categoriesQuery,
  categoryTree,
  imageSrc,
  object,
  safeHref,
  string,
} from "@/components/store/store-data";
import {
  StoreError,
  StoreImage,
  StoreLink,
  StoreLoading,
} from "@/components/store/store-ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Visual = {
  image: string;
  link?: string;
  title: string;
  subtitle: string;
  cta: string;
};

function visual(value: JsonValue): Visual | null {
  const item = object(value);
  const image = imageSrc(
    typeof value === "string"
      ? value
      : string(item.imageUrl) || string(item.image) || string(item.url),
  );
  if (!image) return null;
  return {
    image,
    link: safeHref(string(item.link) || string(item.href)),
    title: string(item.title),
    subtitle: string(item.subtitle),
    cta: string(item.ctaText) || string(item.buttonText),
  };
}

function visuals(values: JsonValue[]) {
  return values.map(visual).filter((value): value is Visual => !!value);
}

function limit(config: JsonObject, fallback: number) {
  return typeof config.limit === "number" && Number.isInteger(config.limit)
    ? Math.min(100, Math.max(1, config.limit))
    : fallback;
}

export function DynamicSectionRenderer({
  section,
}: {
  section: IHomepageSection;
}) {
  const config = object(section.config);
  switch (section.type) {
    case "HERO_SLIDER": {
      const source = config.slides ?? config.images;
      const slides = visuals(Array.isArray(source) ? source : [config]);
      return slides.length ? <Hero section={section} slides={slides} /> : null;
    }
    case "BANNER": {
      const source = config.banners ?? config.images;
      const banners = visuals(Array.isArray(source) ? source : [config]);
      return banners.length ? (
        <BannerGrid section={section} banners={banners} />
      ) : null;
    }
    case "FEATURED_CATEGORIES":
      return <FeaturedCategories section={section} config={config} />;
    case "PRODUCT_COLLECTION":
      return <ProductCollection section={section} config={config} />;
    case "CUSTOM_HTML": {
      const html =
        string(config.html) ||
        (typeof section.config === "string" ? section.config : "");
      return html ? (
        <section className="rounded-2xl border bg-card p-5 sm:p-8">
          <Heading section={section} />
          <RichText content={html} />
        </section>
      ) : null;
    }
  }
}

function Heading({ section }: { section: IHomepageSection }) {
  return (
    <div className="mb-4 space-y-1 sm:mb-6">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {section.title}
      </h2>
      {section.subtitle && (
        <p className="text-sm text-muted-foreground sm:text-base">
          {section.subtitle}
        </p>
      )}
    </div>
  );
}

function Hero({
  section,
  slides,
}: {
  section: IHomepageSection;
  slides: Visual[];
}) {
  const [index, setIndex] = useState(0);
  const active = index % slides.length;
  const slide = slides[active];
  function move(delta: number) {
    setIndex((current) => (current + delta + slides.length) % slides.length);
  }

  return (
    <section
      aria-label={section.title}
      aria-roledescription="carousel"
      className="relative isolate overflow-hidden rounded-2xl bg-emerald-950 text-white sm:rounded-3xl"
    >
      <StoreImage
        src={slide.image}
        alt=""
        sizes="(max-width: 1280px) 100vw, 1232px"
        className="absolute inset-0 -z-20 size-full bg-emerald-950"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/50 to-black/15" />
      <div
        className="flex min-h-84 items-center px-6 py-16 sm:min-h-112 sm:px-12 lg:px-16"
        aria-live="polite"
      >
        <div className="max-w-xl space-y-4">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
            {slide.title || section.title}
          </h2>
          {(slide.subtitle || section.subtitle) && (
            <p className="max-w-md text-sm text-white/90 sm:text-lg">
              {slide.subtitle || section.subtitle}
            </p>
          )}
          {slide.link && (
            <StoreLink
              href={slide.link}
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-1 rounded-full bg-white px-5 text-emerald-950 hover:bg-white/90",
              )}
            >
              {slide.cta || "Shop now"}
              <ArrowUpRight aria-hidden="true" />
            </StoreLink>
          )}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="absolute right-4 bottom-4 left-4 flex flex-wrap items-center justify-end gap-2 sm:right-6">
          <span className="rounded-full bg-black/65 px-3 py-1.5 text-xs">
            {active + 1} / {slides.length}
          </span>
          <Button
            type="button"
            size="icon"
            className="rounded-full bg-black/65 hover:bg-black/85"
            aria-label="Previous slide"
            onClick={() => move(-1)}
          >
            <ArrowLeft />
          </Button>
          <Button
            type="button"
            size="icon"
            className="rounded-full bg-black/65 hover:bg-black/85"
            aria-label="Next slide"
            onClick={() => move(1)}
          >
            <ArrowRight />
          </Button>
        </div>
      )}
    </section>
  );
}

function BannerGrid({
  section,
  banners,
}: {
  section: IHomepageSection;
  banners: Visual[];
}) {
  return (
    <section>
      <Heading section={section} />
      <div className={cn("grid gap-4", banners.length > 1 && "sm:grid-cols-2")}>
        {banners.map((banner, index) => {
          const image = (
            <StoreImage
              src={banner.image}
              alt={banner.title || section.title}
              sizes={
                banners.length > 1 ? "(max-width: 640px) 100vw, 50vw" : "100vw"
              }
              className="aspect-[3/1] w-full rounded-2xl"
            />
          );
          return banner.link ? (
            <StoreLink
              key={index}
              href={banner.link}
              className="block rounded-2xl focus-visible:ring-2"
            >
              {image}
            </StoreLink>
          ) : (
            <div key={index}>{image}</div>
          );
        })}
      </div>
    </section>
  );
}

function FeaturedCategories({
  section,
  config,
}: {
  section: IHomepageSection;
  config: JsonObject;
}) {
  const query = useQuery({
    queryKey: ["store", "featured-categories"],
    queryFn: () => getPublicCategories(true),
  });
  const selected = new Set(
    Array.isArray(config.categoryIds) ? config.categoryIds : [],
  );
  const list = categoryTree(query.data ?? [])
    .map(({ category }) => category)
    .filter(
      (category) =>
        category.isFeatured && (!selected.size || selected.has(category.id)),
    )
    .slice(0, limit(config, 6));
  if (query.data && !list.length) return null;
  return (
    <section>
      <Heading section={section} />
      {query.isPending && <StoreLoading />}
      {query.error && <StoreError retry={() => void query.refetch()} />}
      {list.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {list.map((category) => (
            <li key={category.id}>
              <Link
                href={`/category/${encodeURIComponent(category.slug)}`}
                className="group block overflow-hidden rounded-2xl border bg-card text-center hover:shadow-sm"
              >
                <StoreImage
                  src={category.iconUrl || category.bannerUrl || ""}
                  alt=""
                  sizes="(max-width:640px) 50vw, 200px"
                  className="aspect-[5/4] w-full"
                />
                <span className="block break-words px-2 py-3 text-sm font-semibold group-hover:underline">
                  {category.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProductCollection({
  section,
  config,
}: {
  section: IHomepageSection;
  config: JsonObject;
}) {
  const categories = useQuery(categoriesQuery);
  const tree = categoryTree(categories.data ?? []);
  const explicitSlug = string(config.categorySlug);
  const categoryId = string(config.categoryId);
  const categorySlug =
    explicitSlug ||
    tree.find(({ category }) => category.id === categoryId)?.category.slug;
  const filters = {
    categorySlug,
    isFeatured:
      typeof config.isFeatured === "boolean" ? config.isFeatured : undefined,
    limit: limit(config, 8),
  };
  const enabled = !categoryId || !!categorySlug;
  const query = useQuery({
    queryKey: ["store", "products", filters],
    queryFn: () => getPublicProducts(filters),
    enabled,
  });
  if ((!enabled && categories.data) || (query.data && !query.data.data.length))
    return null;
  const error = !enabled ? categories.error : query.error;
  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Heading section={section} />
        {query.data && (
          <Link
            href={
              categorySlug
                ? `/category/${encodeURIComponent(categorySlug)}`
                : filters.isFeatured === true
                  ? "/products?isFeatured=true"
                  : "/products"
            }
            className={buttonVariants({ variant: "outline" })}
          >
            View products
            <ArrowUpRight aria-hidden="true" />
          </Link>
        )}
      </div>
      {error ? (
        <StoreError
          retry={() => void (enabled ? query.refetch() : categories.refetch())}
        />
      ) : query.isPending ? (
        <StoreLoading />
      ) : (
        query.data && (
          <ProductGrid
            products={query.data.data}
            categoryNames={
              new Map(tree.map(({ category }) => [category.id, category.name]))
            }
          />
        )
      )}
    </section>
  );
}
