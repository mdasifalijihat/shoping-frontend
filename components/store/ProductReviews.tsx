"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { getProductReviews, submitReview } from "@/app/services/review.service";
import { StoreError } from "@/components/store/store-ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";

const date = new Intl.DateTimeFormat("en-BD", {
  dateStyle: "medium",
  timeZone: "Asia/Dhaka",
});

export function ProductReviews({ productId }: { productId: string }) {
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState(false);
  const session = authClient.useSession();
  const customer =
    session.data?.user.role === "CUSTOMER" && !session.data.user.isBlocked;
  const cache = useQueryClient();
  const key = ["store", "reviews", productId];
  const query = useQuery({
    queryKey: [...key, page],
    queryFn: () => getProductReviews(productId, page),
  });
  const data = query.data?.data;
  const meta = query.data?.meta;

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Customer reviews</h2>
        {data?.summary.reviewCount ? (
          <span className="flex items-center gap-2 text-sm">
            <Star className="size-4 fill-amber-400 text-amber-500" />{" "}
            {data.summary.averageRating?.toFixed(1)} / 5 (
            {data.summary.reviewCount})
          </span>
        ) : null}
      </div>
      {query.isPending && <Skeleton className="h-24" />}
      {query.error && (
        <StoreError
          message="Reviews are unavailable."
          retry={() => void query.refetch()}
        />
      )}
      {data &&
        (data.reviews.length ? (
          <ul className="divide-y">
            {data.reviews.map((review) => (
              <li key={review.id} className="space-y-1 py-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <strong>{review.user.name}</strong>
                  <span className="text-muted-foreground">
                    {date.format(new Date(review.createdAt))}
                  </span>
                </div>
                <p className="text-sm font-medium">{review.rating} / 5 stars</p>
                {review.comment && (
                  <p className="break-words whitespace-pre-line text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No approved reviews yet.
          </p>
        ))}
      {meta && meta.totalPage > 1 && (
        <div className="flex items-center gap-3 text-sm">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </Button>
          <span>
            {page} / {meta.totalPage}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={page >= meta.totalPage}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      )}
      {customer ? (
        <form
          method="post"
          className="space-y-4 border-t pt-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (pending) return;
            const form = event.currentTarget;
            const values = new FormData(form);
            const rating = Number(values.get("rating"));
            if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
            setPending(true);
            try {
              await submitReview({
                productId,
                rating,
                comment: String(values.get("comment") ?? "").trim() || null,
              });
              form.reset();
              setPage(1);
              await cache.invalidateQueries({ queryKey: key });
              toast.success("Review submitted for approval.");
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Could not submit your review.",
              );
            } finally {
              setPending(false);
            }
          }}
        >
          <h3 className="font-semibold">Write a review</h3>
          <div className="grid max-w-44 gap-2">
            <Label htmlFor="review-rating">Rating</Label>
            <select
              id="review-rating"
              name="rating"
              defaultValue="5"
              className="h-9 rounded-lg border bg-background px-2 text-sm"
            >
              {[5, 4, 3, 2, 1].map((score) => (
                <option key={score} value={score}>
                  {score} / 5
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="review-comment">Comment</Label>
            <Textarea id="review-comment" name="comment" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Submitting..." : "Submit review"}
          </Button>
        </form>
      ) : (
        !session.isPending &&
        !session.data?.user && (
          <Link
            href="/login"
            className={buttonVariants({ variant: "outline" })}
          >
            Log in to write a review
          </Link>
        )
      )}
    </section>
  );
}
