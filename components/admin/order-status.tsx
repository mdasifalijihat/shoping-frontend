import type { OrderStatus, PaymentStatus } from "@/app/types/order.types";
import { Badge } from "@/components/ui/badge";

export const orderStatuses = [
  "PENDING",
  "PAYMENT_VERIFIED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const satisfies readonly OrderStatus[];
export const paymentStatuses = [
  "UNPAID",
  "PENDING_VERIFICATION",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const satisfies readonly PaymentStatus[];

export function statusLabel(status: string) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (first) => first.toUpperCase());
}

export function StatusBadge({
  status,
}: {
  status: OrderStatus | PaymentStatus;
}) {
  const variant =
    status === "CANCELLED" || status === "FAILED"
      ? "destructive"
      : status === "PAID" ||
          status === "DELIVERED" ||
          status === "PAYMENT_VERIFIED"
        ? "default"
        : "outline";
  return (
    <Badge
      variant={variant}
      className={
        status === "PENDING_VERIFICATION"
          ? "border-amber-500/55 bg-amber-500/10"
          : undefined
      }
    >
      {statusLabel(status)}
    </Badge>
  );
}
