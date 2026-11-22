"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Suspense } from "react";

import { getAdminProductById } from "@/app/services/product.service";
import {
  AdminError,
  AdminHeading,
  AdminLoading,
} from "@/components/admin/admin-ui";
import { productKey } from "@/components/admin/catalog-ui";
import { ProductForm } from "@/components/admin/ProductForm";

export default function EditProductPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditProduct />
    </Suspense>
  );
}

function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: productKey(id),
    queryFn: () => getAdminProductById(id),
  });

  if (query.data) return <ProductForm key={id} product={query.data} />;
  return (
    <>
      <AdminHeading
        title="Edit product"
        description="Update product details, inventory, and variants."
      />
      {query.error ? (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      ) : (
        <AdminLoading />
      )}
    </>
  );
}
