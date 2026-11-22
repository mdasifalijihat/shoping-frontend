"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { getPublicHomepageSections } from "@/app/services/siteSetting.service";
import { DynamicSectionRenderer } from "@/components/store/DynamicSectionRenderer";
import { StoreError, StoreLoading } from "@/components/store/store-ui";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  const query = useQuery({
    queryKey: ["store", "homepage"],
    queryFn: getPublicHomepageSections,
  });
  const sections = (query.data ?? [])
    .filter((item) => item.isActive)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-10 px-4 py-5 sm:space-y-14 sm:px-6 sm:py-8">
      <h1 className="sr-only">Store home</h1>
      {query.isPending && <StoreLoading />}
      {query.error && <StoreError retry={() => void query.refetch()} />}
      {query.data && !sections.length && (
        <div className="rounded-2xl border bg-muted/35 p-8 sm:p-12">
          <h2 className="mb-4 text-2xl font-semibold">Shop the catalog</h2>
          <Link href="/products" className={buttonVariants()}>
            Browse products
          </Link>
        </div>
      )}
      {sections.map((section) => (
        <DynamicSectionRenderer key={section.id} section={section} />
      ))}
    </main>
  );
}
