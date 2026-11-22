import type { JsonObject } from "./api.types";
import type { IProduct } from "./catalog.types";
import type { ICoupon, IPaymentMethod, IShippingZone } from "./payment.types";

export type OrderStatus =
  | "PENDING"
  | "PAYMENT_VERIFIED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type PaymentStatus =
  | "UNPAID"
  | "PENDING_VERIFICATION"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export interface ICartItem {
  id: string;
  cartId: string;
  productId: string;
  product?: Pick<
    IProduct,
    "id" | "title" | "slug" | "thumbnail" | "basePrice" |
    "discountPrice" | "stock" | "variants" | "isActive"
  >;
  quantity: number;
  selectedVariant: JsonObject | null;
  createdAt: string;
  updatedAt: string;
}

export interface IOrder {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddress: string;
  orderNote: string | null;
  subTotal: number;
  shippingCharge: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethodId: string;
  paymentMethod?: IPaymentMethod;
  paymentData: JsonObject;
  shippingZoneId: string | null;
  shippingZone?: IShippingZone | null;
  couponId: string | null;
  coupon?: ICoupon | null;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  items?: IOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface IOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  selectedVariant: JsonObject | null;
}

export interface IReview {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  userId: string;
  productId: string;
  createdAt: string;
  updatedAt: string;
}
