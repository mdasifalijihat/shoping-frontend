import type { IApiResponse } from "@/app/types/api.types";
import type {
  ICoupon,
  IPaymentMethod,
  IShippingZone,
} from "@/app/types/payment.types";
import api from "@/lib/axios";

export type PaymentMethodInput = Pick<IPaymentMethod, "name"> &
  Partial<
    Pick<
      IPaymentMethod,
      | "logoUrl"
      | "accountNumber"
      | "instructions"
      | "customFieldsSchema"
      | "orderIndex"
      | "isActive"
    >
  >;
export type ShippingZoneInput = Pick<IShippingZone, "name" | "charge"> &
  Partial<Pick<IShippingZone, "orderIndex" | "isActive">>;
export type CouponInput = Pick<
  ICoupon,
  "code" | "discountType" | "discountValue"
> &
  Partial<
    Pick<
      ICoupon,
      "minOrderAmount" | "maxDiscount" | "usageLimit" | "expiresAt" | "isActive"
    >
  >;
type Position = { id: string; orderIndex: number };

interface AppliedCoupon {
  valid: true;
  couponId: string;
  code: string;
  discountAmount: number;
  finalAmount: number;
}

export async function getPublicPaymentMethods() {
  return (await api.get<IApiResponse<IPaymentMethod[]>>("/payment-methods"))
    .data.data;
}
export async function getAdminPaymentMethods() {
  return (
    await api.get<IApiResponse<IPaymentMethod[]>>("/payment-methods/admin")
  ).data.data;
}
export async function createPaymentMethod(data: PaymentMethodInput) {
  return (
    await api.post<IApiResponse<IPaymentMethod>>("/payment-methods", data)
  ).data.data;
}
export async function updatePaymentMethod(
  id: string,
  data: Partial<PaymentMethodInput>,
) {
  return (
    await api.patch<IApiResponse<IPaymentMethod>>(
      `/payment-methods/${encodeURIComponent(id)}`,
      data,
    )
  ).data.data;
}
export async function reorderPaymentMethods(items: Position[]) {
  return (
    await api.patch<IApiResponse<IPaymentMethod[]>>(
      "/payment-methods/reorder",
      { items },
    )
  ).data.data;
}
export async function deletePaymentMethod(id: string) {
  await api.delete(`/payment-methods/${encodeURIComponent(id)}`);
}

export async function getPublicShippingZones() {
  return (await api.get<IApiResponse<IShippingZone[]>>("/shipping-zones")).data
    .data;
}
export async function getAdminShippingZones() {
  return (await api.get<IApiResponse<IShippingZone[]>>("/shipping-zones/admin"))
    .data.data;
}
export async function createShippingZone(data: ShippingZoneInput) {
  return (await api.post<IApiResponse<IShippingZone>>("/shipping-zones", data))
    .data.data;
}
export async function updateShippingZone(
  id: string,
  data: Partial<ShippingZoneInput>,
) {
  return (
    await api.patch<IApiResponse<IShippingZone>>(
      `/shipping-zones/${encodeURIComponent(id)}`,
      data,
    )
  ).data.data;
}
export async function reorderShippingZones(items: Position[]) {
  return (
    await api.patch<IApiResponse<IShippingZone[]>>("/shipping-zones/reorder", {
      items,
    })
  ).data.data;
}
export async function deleteShippingZone(id: string) {
  await api.delete(`/shipping-zones/${encodeURIComponent(id)}`);
}

export async function getAdminCoupons() {
  return (await api.get<IApiResponse<ICoupon[]>>("/coupons/admin")).data.data;
}
export async function createCoupon(data: CouponInput) {
  return (await api.post<IApiResponse<ICoupon>>("/coupons", data)).data.data;
}
export async function updateCoupon(id: string, data: Partial<CouponInput>) {
  return (
    await api.patch<IApiResponse<ICoupon>>(
      `/coupons/${encodeURIComponent(id)}`,
      data,
    )
  ).data.data;
}
export async function deleteCoupon(id: string) {
  await api.delete(`/coupons/${encodeURIComponent(id)}`);
}
export async function applyCoupon(code: string, subTotal: number) {
  return (
    await api.post<IApiResponse<AppliedCoupon>>("/coupons/apply", {
      code,
      subTotal,
    })
  ).data.data;
}
