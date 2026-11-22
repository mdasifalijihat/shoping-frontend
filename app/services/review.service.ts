import type { IApiResponse } from "@/app/types/api.types";
import type { IReview } from "@/app/types/order.types";
import api from "@/lib/axios";

type PublicReview = Pick<
  IReview,
  "id" | "rating" | "comment" | "createdAt" | "updatedAt"
> & { user: { name: string; image: string | null } };
type ReviewList = {
  reviews: PublicReview[];
  summary: { averageRating: number | null; reviewCount: number };
};

export async function getProductReviews(id: string, page: number) {
  return (
    await api.get<IApiResponse<ReviewList>>(
      `/reviews/product/${encodeURIComponent(id)}`,
      { params: { page, limit: 6 } },
    )
  ).data;
}

export async function submitReview(data: {
  productId: string;
  rating: number;
  comment?: string | null;
}) {
  return (await api.post<IApiResponse<IReview>>("/reviews", data)).data.data;
}
