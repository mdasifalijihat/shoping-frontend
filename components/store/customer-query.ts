import { getProfile } from "@/app/services/profile.service";

export const customerQueryKey = ["store", "customer"] as const;

export function profileQuery(id?: string) {
  return {
    queryKey: [...customerQueryKey, id, "profile"],
    queryFn: getProfile,
    enabled: Boolean(id),
  };
}
