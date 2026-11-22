"use client";

import { ArrowUpRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { useCartStore } from "@/app/store/useCartStore";
import type { IProduct } from "@/app/types/catalog.types";
import { makeCartItem, money, variantsOf } from "@/components/store/store-data";
import { StoreImage } from "@/components/store/store-ui";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  categoryName,
}: {
  product: IProduct;
  categoryName?: string;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const href = `/products/${encodeURIComponent(product.slug)}`;
  const variants = variantsOf(product);
  const stock = variants.length
    ? variants.some((variant) => variant.stock > 0)
    : product.stock > 0;
  const discount =
    product.discountPrice !== null &&
    product.discountPrice < product.basePrice &&
    product.basePrice > 0
      ? Math.round(
          (100 * (product.basePrice - product.discountPrice)) /
            product.basePrice,
        )
      : 0;
  const price = product.discountPrice ?? product.basePrice;
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md">
      <Link
        href={href}
        aria-label={`View ${product.title}`}
        className="relative block overflow-hidden"
      >
        <StoreImage
          src={product.thumbnail}
          alt=""
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="aspect-[4/3] w-full"
        />
        {discount > 0 && (
          <Badge className="absolute top-2.5 left-2.5 bg-emerald-950 text-white">
            −{discount}%
          </Badge>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        {(product.category?.name || categoryName) && (
          <p className="truncate text-xs text-muted-foreground">
            {product.category?.name || categoryName}
          </p>
        )}
        <h3 className="break-words text-sm leading-snug font-semibold sm:text-base">
          <Link href={href} className="hover:underline">
            {product.title}
          </Link>
        </h3>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1 text-sm">
          <span className="font-semibold tabular-nums">
            {money.format(price)}
          </span>
          {discount > 0 && (
            <span className="text-xs text-muted-foreground line-through">
              {money.format(product.basePrice)}
            </span>
          )}
        </div>
        <Badge
          variant={stock ? "outline" : "secondary"}
          className={
            stock
              ? "border-emerald-700/35 text-emerald-800 dark:text-emerald-300"
              : undefined
          }
        >
          {stock ? "In stock" : "Out of stock"}
        </Badge>
        {variants.length || !stock ? (
          <Link
            href={href}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "mt-1 min-h-9 w-full",
            )}
          >
            View Details
            <ArrowUpRight aria-hidden="true" />
          </Link>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="mt-1 min-h-9 w-full"
            onClick={() => {
              if (addItem(makeCartItem(product)))
                toast.success("Added to cart.");
              else toast.error("You've reached the available stock.");
            }}
          >
            <ShoppingBag aria-hidden="true" /> Add to Cart
          </Button>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  categoryNames,
}: {
  products: IProduct[];
  categoryNames?: Map<string, string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          categoryName={categoryNames?.get(product.categoryId)}
        />
      ))}
    </div>
  );
}
