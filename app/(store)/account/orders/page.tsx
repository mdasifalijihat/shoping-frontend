"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { getMyOrders, getOrderById } from "@/app/services/order.service";
import { displayDate } from "@/components/admin/commerce-format";
import { AdminPagination } from "@/components/admin/commerce-table";
import { StatusBadge } from "@/components/admin/order-status";
import { customerQueryKey } from "@/components/store/customer-query";
import { OrderLines, PricingSummary } from "@/components/store/OrderBreakdown";
import { money } from "@/components/store/store-data";
import { StoreError, StoreLoading } from "@/components/store/store-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

export default function MyOrdersPage() {
  const session = authClient.useSession();
  const user =
    session.isPending || session.data?.user.isBlocked
      ? undefined
      : session.data?.user;
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<{
    id: string;
    number: string;
  } | null>(null);
  const query = useQuery({
    queryKey: [...customerQueryKey, user?.id, "orders", page],
    queryFn: () => getMyOrders({ page, limit: 10 }),
    enabled: user?.role === "CUSTOMER",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Orders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user && user.role !== "CUSTOMER" ? (
          <p className="text-sm text-muted-foreground">
            Customer order history is available to customer accounts.
          </p>
        ) : (
          <>
            {query.isPending && <StoreLoading rows={2} />}
            {query.error && (
              <StoreError
                message="We couldn't load your orders."
                retry={() => void query.refetch()}
              />
            )}
            {query.data &&
              (query.data.data.length ? (
                <ul className="divide-y">
                  {query.data.data.map((order) => (
                    <li
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
                    >
                      <div className="min-w-36 space-y-1">
                        <p className="break-all font-semibold">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {displayDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            Order
                          </span>
                          <StatusBadge status={order.orderStatus} />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            Payment
                          </span>
                          <StatusBadge status={order.paymentStatus} />
                        </div>
                      </div>
                      <strong className="tabular-nums">
                        {money.format(order.totalAmount)}
                      </strong>
                      <Button
                        type="button"
                        variant="outline"
                        aria-label={`View details for ${order.orderNumber}`}
                        onClick={() =>
                          setSelected({
                            id: order.id,
                            number: order.orderNumber,
                          })
                        }
                      >
                        View details
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No orders yet.{" "}
                  <Link
                    href="/products"
                    className="font-medium text-foreground underline"
                  >
                    Browse products
                  </Link>
                </p>
              ))}
            {query.data?.meta && query.data.meta.totalPage > 1 && (
              <AdminPagination
                meta={query.data.meta}
                label="orders"
                onPage={setPage}
              />
            )}
          </>
        )}
        <Dialog
          open={!!selected && user?.role === "CUSTOMER"}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        >
          <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{selected?.number}</DialogTitle>
              <DialogDescription>Order details and pricing</DialogDescription>
            </DialogHeader>
            {selected && user?.role === "CUSTOMER" && (
              <OrderDetails id={selected.id} customerId={user.id} />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function OrderDetails({ id, customerId }: { id: string; customerId: string }) {
  const query = useQuery({
    queryKey: [...customerQueryKey, customerId, "order", id],
    queryFn: () => getOrderById(id),
  });
  if (query.isPending) return <Skeleton className="h-36" />;
  if (query.error)
    return (
      <StoreError
        message="We couldn't load these order details."
        retry={() => void query.refetch()}
      />
    );
  const order = query.data;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Shipping to{" "}
        <span className="font-medium text-foreground">
          {order.shippingAddress}
        </span>
      </p>
      <p className="text-sm text-muted-foreground">
        Payment method{" "}
        <span className="font-medium text-foreground">
          {order.paymentMethod.name}
        </span>
      </p>
      <OrderLines items={order.items} />
      <PricingSummary
        subTotal={order.subTotal}
        shippingCharge={order.shippingCharge}
        discountAmount={order.discountAmount}
        totalAmount={order.totalAmount}
      />
    </div>
  );
}
