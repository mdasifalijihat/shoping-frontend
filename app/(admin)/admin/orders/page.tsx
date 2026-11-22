"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import {
  getAdminOrders,
  type AdminOrderParams,
} from "@/app/services/order.service";
import { getAdminPaymentMethods } from "@/app/services/paymentMethod.service";
import {
  AdminError,
  AdminHeading,
  AdminLoading,
  Field,
  SelectField,
} from "@/components/admin/admin-ui";
import {
  displayDate,
  money,
  paymentMethodsKey,
} from "@/components/admin/commerce-format";
import {
  AdminPagination,
  AdminSearch,
} from "@/components/admin/commerce-table";
import {
  orderStatuses,
  paymentStatuses,
  statusLabel,
  StatusBadge,
} from "@/components/admin/order-status";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function OrdersPage() {
  const [filters, setFilters] = useState<AdminOrderParams>({
    page: 1,
    limit: 20,
  });
  const query = useQuery({
    queryKey: ["admin", "orders", filters],
    queryFn: () => getAdminOrders(filters),
  });
  const methods = useQuery({
    queryKey: paymentMethodsKey,
    queryFn: getAdminPaymentMethods,
  });
  const names = new Map(methods.data?.map(({ id, name }) => [id, name]));

  function filter(changes: AdminOrderParams) {
    setFilters((current) => ({ ...current, ...changes, page: 1 }));
  }

  return (
    <>
      <AdminHeading
        title="Orders"
        description="Find orders and review fulfillment and payment status."
      />
      <Card className="mb-4">
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <AdminSearch
            id="order-search"
            label="Search orders"
            placeholder="Order number, phone, or name"
            onSearch={(value) => filter({ searchTerm: value || undefined })}
          />
          <Field id="filter-order-status" label="Order status">
            <SelectField
              id="filter-order-status"
              value={filters.orderStatus ?? ""}
              onChange={(event) =>
                filter({
                  orderStatus: orderStatuses.find(
                    (status) => status === event.target.value,
                  ),
                })
              }
            >
              <option value="">All order statuses</option>
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </SelectField>
          </Field>
          <Field id="filter-payment-status" label="Payment status">
            <SelectField
              id="filter-payment-status"
              value={filters.paymentStatus ?? ""}
              onChange={(event) =>
                filter({
                  paymentStatus: paymentStatuses.find(
                    (status) => status === event.target.value,
                  ),
                })
              }
            >
              <option value="">All payment statuses</option>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </SelectField>
          </Field>
          <Field id="filter-payment-method" label="Payment method">
            <SelectField
              id="filter-payment-method"
              value={filters.paymentMethodId ?? ""}
              disabled={!methods.data}
              onChange={(event) =>
                filter({ paymentMethodId: event.target.value || undefined })
              }
            >
              <option value="">
                {methods.isPending
                  ? "Loading methods..."
                  : "All payment methods"}
              </option>
              {methods.data?.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </SelectField>
          </Field>
        </CardContent>
      </Card>
      {methods.error && (
        <AdminError
          error={methods.error}
          retry={() => void methods.refetch()}
        />
      )}
      {query.isPending && <AdminLoading />}
      {query.error && (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      )}
      {query.data && (
        <Card>
          <CardContent className="space-y-4">
            {query.data.data.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {[
                      "Order",
                      "Customer",
                      "Payment method",
                      "Total",
                      "Order status",
                      "Payment status",
                      "Placed (Dhaka)",
                    ].map((label) => (
                      <TableHead key={label}>{label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.data.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${encodeURIComponent(order.id)}`}
                          className="font-semibold underline-offset-4 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.customerPhone}
                        </p>
                      </TableCell>
                      <TableCell>
                        {names.get(order.paymentMethodId) ?? "—"}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {money.format(order.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.orderStatus} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.paymentStatus} />
                      </TableCell>
                      <TableCell>{displayDate(order.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">
                No orders match your filters.
              </p>
            )}
            {query.data.meta && (
              <AdminPagination
                meta={query.data.meta}
                label="orders"
                onPage={(page) =>
                  setFilters((current) => ({ ...current, page }))
                }
              />
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
