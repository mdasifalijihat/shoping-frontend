export const paymentMethodsKey = ["admin", "payment-methods"] as const;
export const shippingZonesKey = ["admin", "shipping-zones"] as const;
export const couponsKey = ["admin", "coupons"] as const;

export const money = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
});
export const dateTime = new Intl.DateTimeFormat("en-BD", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Dhaka",
});

export function displayDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTime.format(date);
}
