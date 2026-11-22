import { Suspense } from "react";
import { ProductCatalog } from "@/components/store/ProductCatalog";
import { StoreLoading } from "@/components/store/store-ui";

export default function ProductsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 sm:py-10">
      <h1 className="mb-5 text-3xl font-semibold tracking-tight sm:text-4xl">
        Products
      </h1>
      <Suspense fallback={<StoreLoading />}>
        <ProductCatalog />
      </Suspense>
    </main>
  );
}
