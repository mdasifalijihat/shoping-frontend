"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  CircleAlert,
  ClipboardList,
  CreditCard,
  Users,
} from "lucide-react";

import { getDashboardStats } from "@/app/services/admin.service";
import {
  AdminError,
  AdminHeading,
  AdminLoading,
} from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const money = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
});
const count = new Intl.NumberFormat("en-BD");
const statusLabel = (status: string) =>
  status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (first) => first.toUpperCase());

export default function AdminPage() {
  const stats = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getDashboardStats,
  });
  const data = stats.data;
  const metrics = data
    ? [
        {
          title: "Total revenue",
          value: money.format(data.totalRevenue),
          icon: Banknote,
        },
        {
          title: "Total orders",
          value: count.format(data.totalOrders),
          icon: ClipboardList,
        },
        {
          title: "Pending payment verifications",
          value: count.format(data.pendingPaymentVerifications),
          icon: CreditCard,
        },
        {
          title: "Total customers",
          value: count.format(data.totalCustomers),
          icon: Users,
        },
        {
          title: "Low stock alerts",
          value: count.format(data.lowStockCount),
          icon: CircleAlert,
        },
      ]
    : [];

  return (
    <>
      <AdminHeading
        title="Dashboard"
        description="Review sales, orders, customers, and inventory."
      />
      {stats.isPending && <AdminLoading />}
      {stats.error && (
        <AdminError error={stats.error} retry={() => void stats.refetch()} />
      )}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map(({ title, value, icon: Icon }) => (
              <Card key={title} className="gap-3">
                <CardHeader>
                  <Icon
                    className="mb-1 size-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <CardTitle className="text-sm text-muted-foreground">
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="break-words text-2xl font-semibold tabular-nums">
                  {value}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent orders</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentOrders.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  No orders yet.
                </p>
              ) : (
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
                      ].map((label) => (
                        <TableHead key={label}>{label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>{order.paymentMethod.name}</TableCell>
                        <TableCell className="tabular-nums">
                          {money.format(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.orderStatus === "CANCELLED"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {statusLabel(order.orderStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.paymentStatus === "FAILED"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {statusLabel(order.paymentStatus)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {data.lowStockProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Low stock products</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {data.lowStockProducts.map((product) => (
                    <li
                      key={product.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <span>{product.title}</span>
                      <Badge
                        variant={
                          product.stock === 0 ? "destructive" : "secondary"
                        }
                      >
                        {count.format(product.stock)} left
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
