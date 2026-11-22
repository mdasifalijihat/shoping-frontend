"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { cartItemKey, useCartStore } from "@/app/store/useCartStore";
import { money } from "@/components/store/store-data";
import { StoreImage, StoreLoading } from "@/components/store/store-ui";
import { useCartReady } from "@/components/store/StorefrontProvider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

export default function CartPage() {
  const ready = useCartReady();
  const items = useCartStore((state) => state.items);
  const subTotal = useCartStore((state) => state.subTotal());
  const count = useCartStore((state) => state.totalItems());
  const update = useCartStore((state) => state.updateQuantity);
  const remove = useCartStore((state) => state.removeItem);
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Your cart
      </h1>
      {!ready ? (
        <StoreLoading rows={2} />
      ) : !items.length ? (
        <section className="grid justify-items-center gap-4 rounded-3xl border bg-card px-6 py-14 text-center">
          <span className="grid size-24 place-items-center rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
            <ShoppingBag className="size-10" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <Link href="/products" className={buttonVariants({ size: "lg" })}>
            Continue Shopping
          </Link>
        </section>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <ul className="divide-y rounded-2xl border bg-card px-3 sm:px-5">
            {items.map((item) => {
              const key = cartItemKey(item);
              const variant = item.selectedVariant;
              const options = Object.entries(variant?.attributes ?? {});
              const label = variant
                ? `${item.title} (${variant.sku})`
                : item.title;
              return (
                <li
                  key={key}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                >
                  <StoreImage
                    src={item.thumbnail}
                    alt=""
                    sizes="80px"
                    className="size-16 shrink-0 rounded-lg sm:size-20"
                  />
                  <div className="min-w-0 space-y-1">
                    <Link
                      href={`/products/${encodeURIComponent(item.slug)}`}
                      className="block break-words font-semibold hover:underline"
                    >
                      {item.title}
                    </Link>
                    {variant && (
                      <div className="flex flex-wrap gap-1">
                        {options.length ? (
                          options.map(([name, value]) => (
                            <Badge
                              variant="outline"
                              key={name}
                              className="h-auto whitespace-normal"
                            >
                              {name}: {String(value)}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">{variant.sku}</Badge>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {money.format(item.unitPrice)} each
                    </p>
                  </div>
                  <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 sm:col-span-1 sm:flex-col sm:items-end">
                    <strong className="tabular-nums">
                      {money.format(item.unitPrice * item.quantity)}
                    </strong>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Decrease ${label} quantity`}
                        disabled={item.quantity <= 1}
                        onClick={() => update(key, item.quantity - 1)}
                      >
                        <Minus />
                      </Button>
                      <span
                        aria-label="Quantity"
                        className="min-w-5 text-center text-sm tabular-nums"
                      >
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Increase ${label} quantity`}
                        disabled={item.quantity >= item.maxStock}
                        onClick={() => update(key, item.quantity + 1)}
                      >
                        <Plus />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${label} from cart`}
                        onClick={() => {
                          remove(key);
                          toast.success("Item removed.");
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <section className="space-y-4 rounded-2xl border bg-card p-5 lg:sticky lg:top-5">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt>Total items</dt>
                <dd>{count}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t pt-3">
                <dt>Subtotal</dt>
                <dd className="font-semibold">{money.format(subTotal)}</dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className={buttonVariants({
                size: "lg",
                className:
                  "w-full bg-emerald-950 text-white hover:bg-emerald-900",
              })}
            >
              Proceed to Checkout
            </Link>
          </section>
        </div>
      )}
    </main>
  );
}
