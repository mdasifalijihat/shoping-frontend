import type { IOrder, IOrderItem } from "@/app/types/order.types";
import { money, object } from "@/components/store/store-data";

export type OrderLine = Pick<
  IOrderItem,
  "id" | "productTitle" | "quantity" | "unitPrice" | "selectedVariant"
>;
export type OrderTotals = Pick<
  IOrder,
  "subTotal" | "shippingCharge" | "discountAmount" | "totalAmount"
>;

export function OrderLines({ items }: { items: OrderLine[] }) {
  return (
    <ul className="divide-y">
      {items.map((item) => {
        const variant = item.selectedVariant;
        const pairs = variant
          ? Object.entries(
              variant.attributes === undefined
                ? variant
                : object(variant.attributes),
            )
              .filter(([key]) => key !== "inventory" && key !== "sku")
              .map(([key, value]) => `${key}: ${String(value)}`)
          : [];
        return (
          <li
            key={item.id}
            className="flex items-start justify-between gap-4 py-3 text-sm"
          >
            <div className="min-w-0">
              <p className="break-words font-medium">{item.productTitle}</p>
              {pairs.length > 0 ? (
                <p className="break-words text-xs text-muted-foreground">
                  {pairs.join(" / ")}
                </p>
              ) : (
                typeof variant?.sku === "string" && (
                  <p className="text-xs text-muted-foreground">{variant.sku}</p>
                )
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {item.quantity} × {money.format(item.unitPrice)}
              </p>
            </div>
            <strong className="shrink-0 tabular-nums">
              {money.format(item.quantity * item.unitPrice)}
            </strong>
          </li>
        );
      })}
    </ul>
  );
}

export function PricingSummary({
  subTotal,
  shippingCharge,
  discountAmount,
  totalAmount,
}: OrderTotals) {
  return (
    <dl className="space-y-2 border-t pt-4 text-sm tabular-nums">
      <div className="flex items-center justify-between gap-3">
        <dt>Subtotal</dt>
        <dd>{money.format(subTotal)}</dd>
      </div>
      <div className="flex items-center justify-between gap-3">
        <dt>Shipping</dt>
        <dd>{money.format(shippingCharge)}</dd>
      </div>
      {discountAmount > 0 && (
        <div className="flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300">
          <dt>Discount</dt>
          <dd>−{money.format(discountAmount)}</dd>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 border-t pt-3 text-base font-semibold">
        <dt>Total</dt>
        <dd>{money.format(totalAmount)}</dd>
      </div>
    </dl>
  );
}
