import type { IApiResponse } from "@/app/types/api.types";
import type { OrderStatus, PaymentStatus } from "@/app/types/order.types";
import api from "@/lib/axios";
import type { AuthUser } from "@/lib/auth-client";

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingPaymentVerifications: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  lowStockProducts: {
    id: string;
    title: string;
    slug: string;
    stock: number;
  }[];
  orderStatusCounts: Record<OrderStatus, number>;
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    paymentMethod: { name: string };
    totalAmount: number;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    createdAt: string;
  }[];
}

type UserRole = AuthUser["role"];

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  phone: string | null;
  address: string | null;
  role: UserRole;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  role?: UserRole;
  isBlocked?: boolean;
}

export async function getDashboardStats() {
  return (await api.get<IApiResponse<DashboardStats>>("/admin/dashboard-stats"))
    .data.data;
}

export async function getAllUsers(params: AdminUserParams = {}) {
  return (await api.get<IApiResponse<AdminUser[]>>("/admin/users", { params }))
    .data;
}

export async function updateUserRole(id: string, role: UserRole) {
  return (
    await api.patch<IApiResponse<AdminUser>>(
      `/admin/users/${encodeURIComponent(id)}/role`,
      { role },
    )
  ).data.data;
}

export async function toggleUserBlockStatus(id: string, isBlocked?: boolean) {
  return (
    await api.patch<IApiResponse<AdminUser>>(
      `/admin/users/${encodeURIComponent(id)}/status`,
      isBlocked === undefined ? {} : { isBlocked },
    )
  ).data.data;
}
