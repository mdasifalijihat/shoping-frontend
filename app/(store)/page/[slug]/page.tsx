"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";

import { getCustomPageBySlug } from "@/app/services/siteSetting.service";
import { RichText } from "@/components/store/RichText";
import { StoreError, StoreLoading } from "@/components/store/store-ui";

export default function CustomPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <Suspense fallback={<StoreLoading rows={2} />}>
        <CustomContent />
      </Suspense>
    </main>
  );
}

function CustomContent() {
  const { slug } = useParams<{ slug: string }>();
  const query = useQuery({
    queryKey: ["store", "custom-page", slug],
    queryFn: () => getCustomPageBySlug(slug),
  });
  if (query.isPending) return <StoreLoading rows={2} />;
  if (query.error) {
    if (isAxiosError(query.error) && query.error.response?.status === 404)
      return (
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">Page not found</h1>
          <Link href="/" className="underline">
            Return to the store
          </Link>
        </div>
      );
    return <StoreError retry={() => void query.refetch()} />;
  }
  return (
    <article className="rounded-2xl border bg-card p-5 sm:p-9">
      <h1 className="mb-4 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        {query.data.title}
      </h1>
      {/<[a-z][\s\S]*>/i.test(query.data.content) ? (
        <RichText content={query.data.content} />
      ) : (
        <p className="break-words whitespace-pre-wrap text-muted-foreground">
          {query.data.content}
        </p>
      )}
    </article>
  );
}
