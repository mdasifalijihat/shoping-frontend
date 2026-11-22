"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { getProductBySlug } from "@/app/services/product.service";
import { cartItemKey, useCartStore } from "@/app/store/useCartStore";
import type { IProduct, IProductVariant } from "@/app/types/catalog.types";
import { ProductReviews } from "@/components/store/ProductReviews";
import { makeCartItem, money, variantsOf } from "@/components/store/store-data";
import {
  StoreError,
  StoreImage,
  StoreLoading,
} from "@/components/store/store-ui";
import { VariantSelector } from "@/components/store/VariantSelector";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ProductPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 sm:py-10">
      <Suspense fallback={<StoreLoading />}>
        <ProductDetails />
      </Suspense>
    </main>
  );
}

function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const query = useQuery({
    queryKey: ["store", "product", slug],
    queryFn: () => getProductBySlug(slug),
  });
  if (query.isPending) return <StoreLoading />;
  if (query.error) {
    if (isAxiosError(query.error) && query.error.response?.status === 404)
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Product not found</h1>
          <Link href="/products" className={buttonVariants()}>
            Browse products
          </Link>
        </div>
      );
    return <StoreError retry={() => void query.refetch()} />;
  }
  return <ProductView key={query.data.id} product={query.data} />;
}

function ProductView({ product }: { product: IProduct }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const variants = variantsOf(product);
  const [variantSku, setVariantSku] = useState<string>();
  const [quantity, setQuantity] = useState("1");
  const [image, setImage] = useState(product.thumbnail);
  const gallery = [
    ...new Set([product.thumbnail, ...product.images].filter(Boolean)),
  ];
  const defaultVariant =
    variants.length === 1 && !Object.keys(variants[0].attributes).length
      ? variants[0]
      : undefined;
  const variant =
    variants.find(({ sku }) => sku === variantSku) ?? defaultVariant;
  const hasVariants = variants.length > 0;
  const requiresSelection = hasVariants && !variant;
  const stock = variant?.stock ?? (hasVariants ? 0 : product.stock);
  const price = variant?.price ?? product.discountPrice ?? product.basePrice;
  const priceReduced =
    !variant &&
    product.discountPrice !== null &&
    product.discountPrice < product.basePrice;
  const productKey = cartItemKey(makeCartItem(product, 1, variant));
  const alreadyAdded =
    items.find((item) => cartItemKey(item) === productKey)?.quantity ?? 0;
  const available = Math.max(0, stock - alreadyAdded);
  const amount = Number(quantity);
  const canAdd =
    !requiresSelection &&
    Number.isSafeInteger(amount) &&
    amount >= 1 &&
    amount <= available;
  const specification = Object.entries(product.customAttributes ?? {});
  const hasStock = hasVariants
    ? variants.some((entry) => entry.stock > 0)
    : stock > 0;

  function choose(next: IProductVariant | undefined) {
    setVariantSku(next?.sku);
    setQuantity("1");
  }

  function buy(checkout: boolean) {
    if (!canAdd || !addItem(makeCartItem(product, amount, variant))) {
      toast.error("Check the selected quantity and available stock.");
      return;
    }
    toast.success("Added to cart.");
    if (checkout) router.push("/checkout");
  }

  return (
    <div className="space-y-6">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Products
      </Link>
      <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-10">
        <section className="min-w-0 space-y-3" aria-label="Product gallery">
          <StoreImage
            src={image}
            alt={product.title}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="aspect-[4/3] w-full rounded-2xl border"
            fit="contain"
          />
          {gallery.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {gallery.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Show product image ${index + 1}`}
                  aria-pressed={image === src}
                  onClick={() => setImage(src)}
                  className={cn(
                    "rounded-lg border p-0.5",
                    image === src &&
                      "border-emerald-700 ring-1 ring-emerald-700",
                  )}
                >
                  <StoreImage
                    src={src}
                    alt=""
                    sizes="64px"
                    className="size-14 rounded-md sm:size-16"
                  />
                </button>
              ))}
            </div>
          )}
        </section>
        <div className="min-w-0 space-y-5">
          <div className="space-y-2">
            {product.category && (
              <Link
                href={`/category/${encodeURIComponent(product.category.slug)}`}
                className="text-sm font-semibold text-muted-foreground hover:underline"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">
              {product.title}
            </h1>
            <div
              className="flex flex-wrap items-baseline gap-2"
              aria-live="polite"
            >
              <span className="text-2xl font-semibold tabular-nums">
                {money.format(price)}
              </span>
              {priceReduced && (
                <span className="text-sm text-muted-foreground line-through">
                  {money.format(product.basePrice)}
                </span>
              )}
            </div>
            <Badge
              variant={
                hasStock && (requiresSelection || stock > 0)
                  ? "outline"
                  : "secondary"
              }
              aria-live="polite"
            >
              {!hasStock || (!requiresSelection && stock <= 0)
                ? "Out of stock"
                : requiresSelection
                  ? "Choose options"
                  : `${stock} in stock`}
            </Badge>
          </div>
          {product.description && (
            <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}
          {hasVariants && (
            <VariantSelector variants={variants} onChange={choose} />
          )}
          <div className="space-y-2">
            <label htmlFor="product-quantity" className="text-sm font-semibold">
              Quantity
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Decrease quantity"
                disabled={!Number.isFinite(amount) || amount <= 1}
                onClick={() => setQuantity(String(Math.max(1, amount - 1)))}
              >
                <Minus />
              </Button>
              <Input
                id="product-quantity"
                type="number"
                min={1}
                max={Math.max(1, available)}
                step={1}
                value={quantity}
                disabled={requiresSelection || available === 0}
                onChange={(event) => setQuantity(event.target.value)}
                className="w-19 text-center"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Increase quantity"
                disabled={!Number.isFinite(amount) || amount >= available}
                onClick={() => setQuantity(String(amount + 1))}
              >
                <Plus />
              </Button>
            </div>
            {alreadyAdded > 0 && (
              <p className="text-xs text-muted-foreground">
                {alreadyAdded} already in your cart
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!canAdd}
              className="h-11"
              onClick={() => buy(false)}
            >
              <ShoppingBag /> Add to Cart
            </Button>
            <Button
              type="button"
              disabled={!canAdd}
              className="h-11 bg-emerald-950 text-white hover:bg-emerald-900"
              onClick={() => buy(true)}
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>
      {specification.length > 0 && (
        <section className="rounded-2xl border bg-card p-4 sm:p-6">
          <h2 className="mb-3 text-xl font-semibold">Specifications</h2>
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <tbody>
              {specification.map(([key, value]) => (
                <tr key={key} className="border-b last:border-0">
                  <th
                    scope="row"
                    className="w-2/5 py-2 pr-3 break-words font-medium"
                  >
                    {key}
                  </th>
                  <td className="py-2 break-words text-muted-foreground">
                    {typeof value === "boolean"
                      ? value
                        ? "Yes"
                        : "No"
                      : String(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <ProductReviews productId={product.id} />
    </div>
  );
}
