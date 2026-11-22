import type { IApiResponse } from "@/app/types/api.types";
import type { AuthUser } from "@/lib/auth-client";
import api from "@/lib/axios";

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  image: string | null;
  role: AuthUser["role"];
  isBlocked: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProfileUpdate = Partial<
  Pick<CustomerProfile, "name" | "phone" | "address" | "image">
>;

export async function getProfile() {
  return (await api.get<IApiResponse<CustomerProfile>>("/users/me")).data.data;
}

export async function updateProfile(data: ProfileUpdate) {
  return (await api.patch<IApiResponse<CustomerProfile>>("/users/me", data))
    .data.data;
}
