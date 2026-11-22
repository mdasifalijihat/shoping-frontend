"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Check, CircleDot, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type FormEvent } from "react";

import { trackOrder } from "@/app/services/order.service";
import type { OrderStatus } from "@/app/types/order.types";
import { StatusBadge, statusLabel } from "@/components/admin/order-status";
import { displayDate } from "@/components/admin/commerce-format";
import { OrderLines, PricingSummary } from "@/components/store/OrderBreakdown";
import { StoreError, StoreLoading } from "@/components/store/store-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const steps = [
  "PENDING",
  "PAYMENT_VERIFIED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
] as const;

export default function TrackOrderPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Track an order
      </h1>
      <Suspense fallback={<StoreLoading rows={2} />}>
        <Tracking />
      </Suspense>
    </main>
  );
}

function Tracking() {
  const params = useSearchParams();
  const router = useRouter();
  const orderNumber = (params.get("orderNumber") ?? "").trim().toUpperCase();
  const phone = (
    params.get("phone") ??
    params.get("customerPhone") ??
    ""
  ).trim();
  const enabled = Boolean(orderNumber && phone);
  const query = useQuery({
    queryKey: ["store", "tracking", orderNumber, phone],
    queryFn: () => trackOrder(orderNumber, phone),
    enabled,
    retry: false,
    gcTime: 0,
    staleTime: 0,
  });

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextOrder = String(data.get("orderNumber") ?? "")
      .trim()
      .toUpperCase();
    const nextPhone = String(data.get("phone") ?? "").trim();
    if (!nextOrder || !nextPhone) return;
    if (nextOrder === orderNumber && nextPhone === phone) {
      void query.refetch();
      return;
    }
    router.push(
      `/track-order?${new URLSearchParams({ orderNumber: nextOrder, phone: nextPhone })}`,
    );
  }

  const order = query.data;
  return (
    <>
      <Card>
        <CardContent>
          <form
            key={params.toString()}
            onSubmit={search}
            className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
          >
            <div className="grid gap-2">
              <Label htmlFor="tracking-number">Order number</Label>
              <Input
                id="tracking-number"
                name="orderNumber"
                required
                defaultValue={orderNumber}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tracking-phone">Phone</Label>
              <Input
                id="tracking-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={40}
                required
                defaultValue={phone}
              />
            </div>
            <Button type="submit" disabled={query.isFetching}>
              <Search /> {query.isFetching ? "Looking up..." : "Track order"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {enabled && query.isPending && <StoreLoading rows={2} />}
      {query.error &&
        (isAxiosError(query.error) && query.error.response?.status === 404 ? (
          <p role="alert" className="rounded-xl border bg-card p-4 text-sm">
            No order matches that number and phone. Check both details and try
            again.
          </p>
        ) : (
          <StoreError
            message="We couldn't look up your order."
            retry={() => void query.refetch()}
          />
        ))}
      {order && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{order.orderNumber}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Placed {displayDate(order.createdAt)}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>Order</span>
                  <StatusBadge status={order.orderStatus} />
                </div>
                <div className="flex items-center gap-2">
                  <span>Payment</span>
                  <StatusBadge status={order.paymentStatus} />
                </div>
              </div>
              <OrderProgress status={order.orderStatus} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <OrderLines items={order.items} />
              <PricingSummary
                subTotal={order.subTotal}
                shippingCharge={order.shippingCharge}
                discountAmount={order.discountAmount}
                totalAmount={order.totalAmount}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED" || status === "RETURNED") {
    return (
      <p className="rounded-lg border bg-muted p-3 text-sm">
        {status === "CANCELLED"
          ? "This order was cancelled."
          : "This order was returned."}
      </p>
    );
  }
  const current = steps.indexOf(status);
  return (
    <ol aria-label="Order progress" className="grid gap-2 sm:grid-cols-5">
      {steps.map((step, index) => (
        <li
          key={step}
          aria-current={current === index ? "step" : undefined}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm sm:flex-col sm:items-start sm:text-xs",
            index <= current
              ? "border-emerald-500/35 bg-emerald-500/10"
              : "text-muted-foreground",
            index === current && "font-semibold",
          )}
        >
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full border",
              index <= current && "border-emerald-600",
            )}
          >
            {index < current ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : index === current ? (
              <CircleDot className="size-3.5" aria-hidden="true" />
            ) : (
              <span aria-hidden="true">{index + 1}</span>
            )}
          </span>
          {statusLabel(step)}
          {index < current && <span className="sr-only"> complete</span>}
        </li>
      ))}
    </ol>
  );
}
