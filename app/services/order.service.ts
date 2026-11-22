import type { IApiResponse, JsonObject } from "@/app/types/api.types";
import type {
  IOrder,
  IOrderItem,
  OrderStatus,
  PaymentStatus,
} from "@/app/types/order.types";
import type { IPaymentMethod, IShippingZone } from "@/app/types/payment.types";
import api from "@/lib/axios";

export type OrderSummary = Omit<
  IOrder,
  "items" | "paymentData" | "paymentMethod" | "shippingZone" | "coupon"
> & {
  _count: { items: number };
};

export type OrderDetail = IOrder & {
  items: IOrderItem[];
  paymentMethod: IPaymentMethod;
  shippingZone: IShippingZone | null;
};

export type OrderStatusInput = {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
};

interface PageParams {
  page?: number;
  limit?: number;
}

export interface AdminOrderParams extends PageParams, OrderStatusInput {
  paymentMethodId?: string;
  searchTerm?: string;
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingAddress: string;
  orderNote?: string | null;
  items: {
    productId: string;
    quantity: number;
    selectedVariant?: JsonObject | null;
  }[];
  paymentMethodId: string;
  paymentData?: JsonObject;
  shippingZoneId: string;
  couponCode?: string;
}

export type TrackingOrder = Pick<
  IOrder,
  | "orderNumber"
  | "orderStatus"
  | "paymentStatus"
  | "createdAt"
  | "updatedAt"
  | "subTotal"
  | "shippingCharge"
  | "discountAmount"
  | "totalAmount"
> & {
  items: Pick<
    IOrderItem,
    "id" | "productTitle" | "quantity" | "unitPrice" | "selectedVariant"
  >[];
};

export async function createOrder(data: CreateOrderInput) {
  return (await api.post<IApiResponse<OrderDetail>>("/orders", data)).data.data;
}
export async function getMyOrders(params: PageParams = {}) {
  return (
    await api.get<IApiResponse<OrderSummary[]>>("/orders/my-orders", { params })
  ).data;
}
export async function trackOrder(orderNumber: string, phone: string) {
  return (
    await api.get<IApiResponse<TrackingOrder>>(
      `/orders/track/${encodeURIComponent(orderNumber.trim())}`,
      {
        params: { customerPhone: phone.trim() },
      },
    )
  ).data.data;
}
export async function getAdminOrders(params: AdminOrderParams = {}) {
  return (
    await api.get<IApiResponse<OrderSummary[]>>("/orders/admin", { params })
  ).data;
}
export async function getOrderById(id: string) {
  return (
    await api.get<IApiResponse<OrderDetail>>(
      `/orders/${encodeURIComponent(id)}`,
    )
  ).data.data;
}
export async function updateOrderStatus(id: string, data: OrderStatusInput) {
  return (
    await api.patch<IApiResponse<OrderDetail>>(
      `/orders/${encodeURIComponent(id)}/status`,
      data,
    )
  ).data.data;
}
