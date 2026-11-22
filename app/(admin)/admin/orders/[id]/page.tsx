"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Receipt } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useState } from "react";

import {
  getOrderById,
  updateOrderStatus,
  type OrderDetail,
  type OrderStatusInput,
} from "@/app/services/order.service";
import type { JsonValue } from "@/app/types/api.types";
import type { IOrderItem } from "@/app/types/order.types";
import {
  AdminError,
  AdminHeading,
  AdminLoading,
  Field,
  SelectField,
  useAdminAction,
} from "@/components/admin/admin-ui";
import { displayDate, money } from "@/components/admin/commerce-format";
import { jsonObject } from "@/components/admin/json-fields";
import {
  orderStatuses,
  paymentStatuses,
  statusLabel,
  StatusBadge,
} from "@/components/admin/order-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function OrderDetailsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <OrderDetails />
    </Suspense>
  );
}

function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const orderKey = ["admin", "order", id];
  const query = useQuery({
    queryKey: orderKey,
    queryFn: () => getOrderById(id),
  });
  const cache = useQueryClient();
  const { busy, run } = useAdminAction();
  const order = query.data;

  function save(data: OrderStatusInput) {
    void run(async () => {
      const updated = await updateOrderStatus(id, data);
      cache.setQueryData(orderKey, updated);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["admin", "orders"] }),
        cache.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
        cache.invalidateQueries({ queryKey: ["admin", "products"] }),
        cache.invalidateQueries({ queryKey: ["admin", "product"] }),
        cache.invalidateQueries({ queryKey: ["admin", "coupons"] }),
      ]);
    }, "Order status updated.");
  }

  return (
    <>
      <Link
        href="/admin/orders"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Orders
      </Link>
      <AdminHeading
        title={order ? order.orderNumber : "Order details"}
        description={
          order
            ? `Placed ${displayDate(order.createdAt)} Dhaka time`
            : "Review the invoice and submitted payment details."
        }
      />
      {query.isPending && <AdminLoading />}
      {query.error && (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      )}
      {order && (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer and delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <Detail label="Name" value={order.customerName} />
                  <Detail label="Phone" value={order.customerPhone} />
                  <Detail label="Email" value={order.customerEmail ?? "—"} />
                  <Detail
                    label="Shipping zone"
                    value={order.shippingZone?.name ?? "—"}
                  />
                  <div className="sm:col-span-2">
                    <Detail
                      label="Shipping address"
                      value={order.shippingAddress}
                    />
                  </div>
                  {order.orderNote && (
                    <div className="sm:col-span-2">
                      <Detail label="Order note" value={order.orderNote} />
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
            <StatusForm
              key={`${order.orderStatus}/${order.paymentStatus}`}
              order={order}
              busy={busy}
              onSave={save}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Invoice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    {[
                      "Item",
                      "Selected variant",
                      "Quantity",
                      "Unit price",
                      "Total",
                    ].map((label) => (
                      <TableHead key={label}>{label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.productTitle}
                      </TableCell>
                      <TableCell className="max-w-64 whitespace-normal">
                        {variantSummary(item)}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{money.format(item.unitPrice)}</TableCell>
                      <TableCell>
                        {money.format(item.quantity * item.unitPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <dl className="ml-auto max-w-sm space-y-2 border-t pt-4 text-sm tabular-nums">
                {[
                  ["Subtotal", money.format(order.subTotal)],
                  ["Shipping", money.format(order.shippingCharge)],
                  [
                    "Discount",
                    order.discountAmount
                      ? `−${money.format(order.discountAmount)}`
                      : money.format(0),
                  ],
                  ["Order total", money.format(order.totalAmount)],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={`flex justify-between gap-4 ${index === 3 ? "border-t pt-2 font-semibold" : ""}`}
                  >
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/5 ring-amber-500/35">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="size-4" /> Submitted Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm font-medium">{order.paymentMethod.name}</p>
              {Object.keys(order.paymentData).length ? (
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(order.paymentData).map(([key, value]) => (
                    <div key={key} className="min-w-0">
                      <dt className="mb-1 break-words text-xs text-muted-foreground">
                        {order.paymentMethod.customFieldsSchema.find(
                          (field) => field.name === key,
                        )?.label || key}
                      </dt>
                      <dd>
                        <PaymentValue value={value} />
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No payment details were submitted.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function StatusForm({
  order,
  busy,
  onSave,
}: {
  order: OrderDetail;
  busy: boolean;
  onSave: (data: OrderStatusInput) => void;
}) {
  const [orderStatus, setOrderStatus] = useState(order.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const dirty =
    orderStatus !== order.orderStatus || paymentStatus !== order.paymentStatus;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order and payment status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadge status={order.orderStatus} />
          <StatusBadge status={order.paymentStatus} />
        </div>
        <form
          method="post"
          onSubmit={(event) => {
            event.preventDefault();
            if (!dirty || busy) return;
            if (
              orderStatus !== order.orderStatus &&
              (orderStatus === "CANCELLED" || orderStatus === "RETURNED") &&
              !window.confirm(
                orderStatus === "CANCELLED"
                  ? "Cancel this order and restore its stock? A cancelled order cannot be reopened."
                  : "Mark this order as returned?",
              )
            )
              return;
            onSave({
              ...(orderStatus !== order.orderStatus && { orderStatus }),
              ...(paymentStatus !== order.paymentStatus && { paymentStatus }),
            });
          }}
        >
          <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
            <Field id="edit-order-status" label="Order status">
              <SelectField
                id="edit-order-status"
                disabled={order.orderStatus === "CANCELLED"}
                value={orderStatus}
                onChange={(event) => {
                  const status = orderStatuses.find(
                    (value) => value === event.target.value,
                  );
                  if (status) setOrderStatus(status);
                }}
              >
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </SelectField>
            </Field>
            <Field id="edit-payment-status" label="Payment status">
              <SelectField
                id="edit-payment-status"
                value={paymentStatus}
                onChange={(event) => {
                  const status = paymentStatuses.find(
                    (value) => value === event.target.value,
                  );
                  if (status) setPaymentStatus(status);
                }}
              >
                {paymentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </SelectField>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={!dirty || busy}>
                {busy ? "Saving..." : "Save status"}
              </Button>
            </div>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}

function variantSummary(item: IOrderItem) {
  if (!item.selectedVariant) return "—";
  const { sku, attributes, ...legacy } = item.selectedVariant;
  const pairs = Object.entries(
    attributes === undefined ? legacy : jsonObject(attributes),
  ).filter(([key]) => key !== "inventory");
  const parts = pairs.map(([key, value]) => `${key}: ${text(value)}`);
  if (typeof sku === "string") parts.unshift(sku);
  return parts.join(" · ") || "—";
}

function text(value: JsonValue): string {
  return typeof value === "string"
    ? value
    : value === null
      ? "—"
      : JSON.stringify(value);
}

function PaymentValue({ value }: { value: JsonValue }) {
  if (typeof value === "string") {
    const url = URL.canParse(value) ? new URL(value) : null;
    if (
      url?.protocol === "https:" &&
      url.host === "res.cloudinary.com" &&
      !url.username &&
      !url.password &&
      /^\/[^/]+\/image\/upload\//.test(url.pathname)
    ) {
      return (
        <a
          href={url.href}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          className="inline-grid max-w-full gap-2 text-sm underline-offset-4 hover:underline"
        >
          <span className="relative block aspect-video w-56 max-w-full overflow-hidden rounded-lg border bg-background">
            <Image
              src={url.href}
              alt="Submitted payment screenshot"
              fill
              unoptimized
              referrerPolicy="no-referrer"
              className="object-contain"
            />
          </span>
          <span className="flex items-center gap-1">
            Open image <ArrowUpRight className="size-3" />
          </span>
        </a>
      );
    }
  }
  return (
    <span className="break-all whitespace-pre-wrap text-sm">
      {text(value) || "—"}
    </span>
  );
}
