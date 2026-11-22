export interface ICustomFieldSchema {
  name: string;
  label: string;
  type: "text" | "number" | "tel" | "textarea" | "file" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface IPaymentMethod {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  accountNumber: string | null;
  instructions: string | null;
  customFieldsSchema: ICustomFieldSchema[];
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IShippingZone {
  id: string;
  name: string;
  charge: number;
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICoupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
