import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { imageSrc, safeHref } from "@/components/store/store-data";
import { cn } from "@/lib/utils";

export function StoreImage({
  src,
  alt,
  className,
  sizes,
  fit = "cover",
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  fit?: "cover" | "contain";
}) {
  const image = imageSrc(src);
  return (
    <div
      className={cn(
        "relative grid overflow-hidden bg-muted place-items-center",
        className,
      )}
    >
      {image ? (
        <Image
          src={image}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized={
            !image.startsWith("/") &&
            !image.startsWith("https://res.cloudinary.com/")
          }
          className={fit === "contain" ? "object-contain" : "object-cover"}
        />
      ) : (
        <ImageIcon
          className="size-7 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export function StoreLink({
  href,
  openInNew,
  children,
  ...props
}: Omit<ComponentProps<"a">, "href"> & {
  href: string;
  openInNew?: boolean;
}) {
  const url = safeHref(href);
  if (!url) return <span className={props.className}>{children}</span>;
  if (url.startsWith("/") && !openInNew)
    return (
      <Link href={url} {...props}>
        {children}
      </Link>
    );
  return (
    <a
      href={url}
      {...props}
      target={openInNew ? "_blank" : undefined}
      rel={openInNew ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

export function StoreLoading({ rows = 4 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading storefront"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="aspect-[3/4] rounded-2xl" />
      ))}
    </div>
  );
}

export function StoreError({
  retry,
  message = "We couldn't load this content.",
}: {
  retry: () => void;
  message?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-4 text-sm"
    >
      <p>{message}</p>
      <Button type="button" variant="outline" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
