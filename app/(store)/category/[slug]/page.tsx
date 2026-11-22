"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";

import { getCategoryBySlug } from "@/app/services/category.service";
import { ProductCatalog } from "@/components/store/ProductCatalog";
import {
  StoreError,
  StoreImage,
  StoreLoading,
} from "@/components/store/store-ui";
import { buttonVariants } from "@/components/ui/button";

export default function CategoryPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 sm:py-10">
      <Suspense fallback={<StoreLoading />}>
        <Category />
      </Suspense>
    </main>
  );
}

function Category() {
  const { slug } = useParams<{ slug: string }>();
  const query = useQuery({
    queryKey: ["store", "category", slug],
    queryFn: () => getCategoryBySlug(slug),
  });
  if (query.isPending) return <StoreLoading />;
  if (query.error) {
    if (isAxiosError(query.error) && query.error.response?.status === 404)
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Category not found</h1>
          <Link href="/products" className={buttonVariants()}>
            Browse products
          </Link>
        </div>
      );
    return <StoreError retry={() => void query.refetch()} />;
  }
  const category = query.data;
  const children = (category.children ?? []).filter((child) => child.isActive);
  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-2xl border bg-card">
        {category.bannerUrl && (
          <StoreImage
            src={category.bannerUrl}
            alt=""
            sizes="100vw"
            className="aspect-[3/1] max-h-72 w-full"
          />
        )}
        <div className="space-y-2 p-5 sm:p-7">
          <Link
            href="/products"
            className="text-sm text-muted-foreground hover:underline"
          >
            All products
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="whitespace-pre-line text-muted-foreground">
              {category.description}
            </p>
          )}
        </div>
      </header>
      {children.length > 0 && (
        <nav aria-label="Subcategories" className="flex flex-wrap gap-2">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/category/${encodeURIComponent(child.slug)}`}
              className={buttonVariants({ variant: "outline" })}
            >
              {child.name}
            </Link>
          ))}
        </nav>
      )}
      <ProductCatalog scopedCategory={category} />
    </div>
  );
}
