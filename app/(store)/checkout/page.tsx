"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, LoaderCircle, Truck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createOrder } from "@/app/services/order.service";
import {
  applyCoupon,
  getPublicPaymentMethods,
  getPublicShippingZones,
} from "@/app/services/paymentMethod.service";
import { cartItemKey, useCartStore } from "@/app/store/useCartStore";
import {
  customerQueryKey,
  profileQuery,
} from "@/components/store/customer-query";
import {
  DynamicPaymentForm,
  readPaymentData,
  type PaymentDraft,
} from "@/components/store/DynamicPaymentForm";
import { PricingSummary } from "@/components/store/OrderBreakdown";
import { money } from "@/components/store/store-data";
import {
  StoreError,
  StoreImage,
  StoreLoading,
} from "@/components/store/store-ui";
import { useCartReady } from "@/components/store/StorefrontProvider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type DeliveryDraft = Partial<
  Record<
    "customerName" | "customerPhone" | "customerEmail" | "shippingAddress",
    string
  >
>;
type CouponQuote = Awaited<ReturnType<typeof applyCoupon>> & {
  subTotal: number;
};

export default function CheckoutPage() {
  const ready = useCartReady();
  const count = useCartStore((state) => state.items.length);
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to cart
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Checkout
      </h1>
      {!ready ? (
        <StoreLoading rows={2} />
      ) : count ? (
        <CheckoutForm />
      ) : (
        <div className="space-y-4 rounded-2xl border bg-card p-6">
          <p>Your cart is empty.</p>
          <Link className={buttonVariants()} href="/products">
            Continue Shopping
          </Link>
        </div>
      )}
    </main>
  );
}

function CheckoutForm() {
  const router = useRouter();
  const cache = useQueryClient();
  const session = authClient.useSession();
  const user = session.data?.user;
  const profile = useQuery(profileQuery(user?.id));
  const zones = useQuery({
    queryKey: ["store", "shipping-zones"],
    queryFn: getPublicShippingZones,
  });
  const methods = useQuery({
    queryKey: ["store", "payment-methods"],
    queryFn: getPublicPaymentMethods,
  });
  const items = useCartStore((state) => state.items);
  const subTotal = useCartStore((state) => state.subTotal());
  const count = useCartStore((state) => state.totalItems());
  const [draft, setDraft] = useState<DeliveryDraft>({});
  const [zoneId, setZoneId] = useState("");
  const [methodId, setMethodId] = useState("");
  const [payment, setPayment] = useState<PaymentDraft>({});
  const [uploads, setUploads] = useState<Set<string>>(() => new Set());
  const [code, setCode] = useState("");
  const [quote, setQuote] = useState<CouponQuote>();
  const [applying, setApplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const operation = useRef<"coupon" | "order" | null>(null);
  const activeZones = zones.data?.filter(({ isActive }) => isActive) ?? [];
  const activeMethods = methods.data?.filter(({ isActive }) => isActive) ?? [];
  const zone = activeZones.find(({ id }) => id === zoneId);
  const method = activeMethods.find(({ id }) => id === methodId);
  const currentQuote = quote?.subTotal === subTotal ? quote : undefined;
  const delivery = {
    customerName: draft.customerName ?? profile.data?.name ?? user?.name ?? "",
    customerPhone:
      draft.customerPhone ?? profile.data?.phone ?? user?.phone ?? "",
    customerEmail:
      draft.customerEmail ?? profile.data?.email ?? user?.email ?? "",
    shippingAddress:
      draft.shippingAddress ?? profile.data?.address ?? user?.address ?? "",
  };
  const shippingCharge = zone?.charge ?? 0;
  const discountAmount = currentQuote?.discountAmount ?? 0;

  function setField(field: keyof DeliveryDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function apply() {
    const couponCode = code.trim();
    if (!couponCode || operation.current) return;
    operation.current = "coupon";
    setApplying(true);
    try {
      const result = await applyCoupon(couponCode, subTotal);
      if (useCartStore.getState().subTotal() !== subTotal) {
        toast.error("Your cart changed. Apply the coupon again.");
        return;
      }
      setQuote({ ...result, subTotal });
      setCode(result.code);
      toast.success("Coupon applied.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not apply that coupon.",
      );
    } finally {
      operation.current = null;
      setApplying(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (operation.current || uploads.size) return;
    if (!zone || !method) {
      toast.error("Choose a delivery zone and a payment method.");
      return;
    }
    const cart = useCartStore.getState();
    if (!cart.items.length) return;
    if (quote && quote.subTotal !== cart.subTotal()) {
      toast.error("Your cart changed. Reapply or remove the coupon.");
      return;
    }
    const { customerName, customerPhone, customerEmail, shippingAddress } =
      Object.fromEntries(
        Object.entries(delivery).map(([key, value]) => [key, value.trim()]),
      );
    if (!customerName || !customerPhone || !shippingAddress) {
      toast.error("Enter your name, phone, and shipping address.");
      return;
    }
    const orderNote =
      String(new FormData(event.currentTarget).get("orderNote") ?? "").trim() ||
      null;

    operation.current = "order";
    setSubmitting(true);
    try {
      const paymentData = readPaymentData(method, payment);
      const order = await createOrder({
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        shippingAddress,
        orderNote,
        items: cart.items.map(({ productId, quantity, selectedVariant }) => ({
          productId,
          quantity,
          selectedVariant: selectedVariant
            ? {
                sku: selectedVariant.sku,
                attributes: selectedVariant.attributes,
              }
            : null,
        })),
        paymentMethodId: method.id,
        shippingZoneId: zone.id,
        paymentData,
        couponCode: currentQuote?.code,
      });
      const search = new URLSearchParams({
        orderNumber: order.orderNumber,
        phone: order.customerPhone,
      });
      if (user)
        void cache.invalidateQueries({
          queryKey: [...customerQueryKey, user.id, "orders"],
        });
      cart.clearCart();
      toast.success("Order placed.");
      router.replace(`/track-order?${search}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not place your order.",
      );
    } finally {
      operation.current = null;
      setSubmitting(false);
    }
  }

  return (
    <form
      method="post"
      onSubmit={(event) => void submit(event)}
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <div className="min-w-0 space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Contact and shipping</CardTitle>
          </CardHeader>
          <CardContent>
            {!session.isPending && !user && (
              <p className="mb-4 text-sm text-muted-foreground">
                Checking out as a guest.{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline"
                >
                  Log in
                </Link>{" "}
                to use your saved details.
              </p>
            )}
            <fieldset
              disabled={submitting}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="grid gap-2">
                <Label htmlFor="shipping-name">Full name *</Label>
                <Input
                  id="shipping-name"
                  autoComplete="name"
                  required
                  value={delivery.customerName}
                  onChange={(e) => setField("customerName", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="shipping-phone">Phone *</Label>
                <Input
                  id="shipping-phone"
                  type="tel"
                  maxLength={40}
                  autoComplete="tel"
                  required
                  value={delivery.customerPhone}
                  onChange={(e) => setField("customerPhone", e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="shipping-email">Email</Label>
                <Input
                  id="shipping-email"
                  type="email"
                  autoComplete="email"
                  value={delivery.customerEmail}
                  onChange={(e) => setField("customerEmail", e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="shipping-address">Shipping address *</Label>
                <Textarea
                  id="shipping-address"
                  autoComplete="street-address"
                  required
                  value={delivery.shippingAddress}
                  onChange={(e) => setField("shippingAddress", e.target.value)}
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="shipping-note">Order note</Label>
                <Textarea id="shipping-note" name="orderNote" />
              </div>
            </fieldset>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Delivery zone</CardTitle>
          </CardHeader>
          <CardContent>
            {zones.isPending && <Skeleton className="h-20 w-full" />}
            {zones.error && (
              <StoreError
                message="Delivery zones are unavailable."
                retry={() => void zones.refetch()}
              />
            )}
            {zones.data && !activeZones.length && (
              <p className="text-sm text-muted-foreground">
                No delivery zones are currently available.
              </p>
            )}
            <fieldset
              disabled={submitting}
              className="grid gap-2 sm:grid-cols-2"
            >
              <legend className="sr-only">Delivery zone</legend>
              {activeZones.map((entry) => (
                <label
                  key={entry.id}
                  className={cn(
                    "flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm",
                    zoneId === entry.id &&
                      "border-emerald-700 bg-emerald-500/5",
                  )}
                >
                  <input
                    type="radio"
                    name="shippingZone"
                    checked={zoneId === entry.id}
                    onChange={() => setZoneId(entry.id)}
                    className="accent-emerald-900"
                  />
                  <Truck
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 break-words font-medium">
                    {entry.name}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {money.format(entry.charge)}
                  </span>
                </label>
              ))}
            </fieldset>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {methods.isPending && <Skeleton className="h-20 w-full" />}
            {methods.error && (
              <StoreError
                message="Payment methods are unavailable."
                retry={() => void methods.refetch()}
              />
            )}
            {methods.data && !activeMethods.length && (
              <p className="text-sm text-muted-foreground">
                No payment methods are currently available.
              </p>
            )}
            <fieldset
              disabled={submitting || uploads.size > 0}
              className="grid gap-2 sm:grid-cols-2"
            >
              <legend className="sr-only">Payment method</legend>
              {activeMethods.map((entry) => (
                <label
                  key={entry.id}
                  className={cn(
                    "flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm",
                    methodId === entry.id &&
                      "border-emerald-700 bg-emerald-500/5",
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={methodId === entry.id}
                    onChange={() => {
                      setMethodId(entry.id);
                      setPayment({});
                    }}
                    className="accent-emerald-900"
                  />
                  {entry.logoUrl && (
                    <StoreImage
                      src={entry.logoUrl}
                      sizes="36px"
                      alt=""
                      fit="contain"
                      className="size-9 shrink-0 rounded-md"
                    />
                  )}
                  <span className="min-w-0 break-words font-medium">
                    {entry.name}
                  </span>
                </label>
              ))}
            </fieldset>
            {method && (
              <DynamicPaymentForm
                key={method.id}
                method={method}
                values={payment}
                disabled={submitting}
                onChange={(name, value) =>
                  setPayment((current) => ({ ...current, [name]: value }))
                }
                onUpload={(name, pending) =>
                  setUploads((current) => {
                    const next = new Set(current);
                    if (pending) next.add(name);
                    else next.delete(name);
                    return next;
                  })
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="lg:sticky lg:top-5">
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="divide-y">
            {items.map((item) => (
              <li
                key={cartItemKey(item)}
                className="flex justify-between gap-3 py-2 text-sm"
              >
                <div className="min-w-0 break-words">
                  {item.title}
                  <span className="ml-1 text-xs text-muted-foreground">
                    × {item.quantity}
                  </span>
                  {item.selectedVariant && (
                    <p className="text-xs text-muted-foreground">
                      {Object.values(item.selectedVariant.attributes)
                        .map(String)
                        .join(" / ") || item.selectedVariant.sku}
                    </p>
                  )}
                </div>
                <strong className="shrink-0 tabular-nums">
                  {money.format(item.unitPrice * item.quantity)}
                </strong>
              </li>
            ))}
          </ul>
          <div className="grid gap-2">
            <Label htmlFor="checkout-coupon">Coupon code</Label>
            <div className="flex gap-2">
              <Input
                id="checkout-coupon"
                value={code}
                disabled={submitting || applying}
                onChange={(event) => setCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    void apply();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={applying || submitting || !code.trim()}
                onClick={() => void apply()}
              >
                {applying ? "Applying..." : "Apply"}
              </Button>
            </div>
            {quote && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={currentQuote ? "secondary" : "outline"}>
                  {quote.code}
                  {currentQuote ? " applied" : " needs reapplying"}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={applying || submitting}
                  aria-label="Remove coupon"
                  onClick={() => {
                    setQuote(undefined);
                    setCode("");
                  }}
                >
                  <X />
                </Button>
              </div>
            )}
          </div>
          <PricingSummary
            subTotal={subTotal}
            shippingCharge={shippingCharge}
            discountAmount={discountAmount}
            totalAmount={subTotal + shippingCharge - discountAmount}
          />
          {!zone && (
            <p className="text-xs text-muted-foreground">
              Select a delivery zone to calculate shipping.
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full bg-emerald-950 text-white hover:bg-emerald-900"
            disabled={
              submitting ||
              applying ||
              uploads.size > 0 ||
              !zone ||
              !method ||
              (!!quote && !currentQuote)
            }
          >
            {submitting ? (
              <>
                <LoaderCircle className="animate-spin" /> Placing order...
              </>
            ) : (
              <>
                Place order <ArrowRight />
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {count} {count === 1 ? "item" : "items"}
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
