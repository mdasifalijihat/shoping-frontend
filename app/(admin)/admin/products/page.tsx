"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  deleteProduct,
  getAdminProducts,
  updateProduct,
  type AdminProductParams,
} from "@/app/services/product.service";
import type { IProduct } from "@/app/types/catalog.types";
import {
  AdminError,
  AdminHeading,
  AdminLoading,
  Field,
  Toggle,
  flattenTree,
  useAdminAction,
} from "@/components/admin/admin-ui";
import {
  adminCategoriesQuery,
  CatalogImage,
  CategorySelect,
  productKey,
  productListKey,
} from "@/components/admin/catalog-ui";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const money = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
});
const pageSize = 20;

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AdminProductParams>({
    page: 1,
    limit: pageSize,
  });
  const query = useQuery({
    queryKey: [...productListKey, filters],
    queryFn: () => getAdminProducts(filters),
  });
  const categories = useQuery(adminCategoriesQuery);
  const cache = useQueryClient();
  const { busy, run } = useAdminAction();
  const categoryNames = new Map(
    flattenTree(categories.data ?? []).map(({ item }) => [item.id, item.name]),
  );
  const page = filters.page ?? 1;
  const meta = query.data?.meta;
  const lastPage = Math.max(1, meta?.totalPage ?? 1);

  function toggle(
    product: IProduct,
    key: "isFeatured" | "isActive",
    value: boolean,
  ) {
    void run(async () => {
      await updateProduct(product.id, { [key]: value });
      await Promise.all([
        cache.invalidateQueries({ queryKey: productListKey }),
        cache.invalidateQueries({ queryKey: productKey(product.id) }),
      ]);
    }, "Product updated.");
  }

  function remove(product: IProduct) {
    if (
      !window.confirm(
        `Delete "${product.title}"? Products with order history will be deactivated.`,
      )
    )
      return;
    void run(async () => {
      const result = await deleteProduct(product.id);
      await Promise.all([
        cache.invalidateQueries({ queryKey: productListKey }),
        cache.invalidateQueries({ queryKey: adminCategoriesQuery.queryKey }),
        cache.invalidateQueries({ queryKey: productKey(product.id) }),
        cache.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
      ]);
      const refreshed = cache.getQueryData<typeof query.data>([
        ...productListKey,
        filters,
      ]);
      if (refreshed?.meta && page > Math.max(1, refreshed.meta.totalPage)) {
        setFilters((current) => ({
          ...current,
          page: Math.max(1, refreshed.meta!.totalPage),
        }));
      }
      return result.message === "Product deactivated"
        ? "Product deactivated because it has order history."
        : "Product deleted.";
    }, "Product deleted.");
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-4">
        <AdminHeading
          title="Products"
          description="Search, edit, and manage products across your store."
        />
        <Link href="/admin/products/create" className={buttonVariants()}>
          <Plus /> Add New Product
        </Link>
      </div>
      <Card className="mb-4">
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(12rem,20rem)]">
            <form
              method="get"
              onSubmit={(event) => {
                event.preventDefault();
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  searchTerm: search.trim() || undefined,
                }));
              }}
            >
              <Field id="catalog-search" label="Search products">
                <div className="flex gap-2">
                  <Input
                    id="catalog-search"
                    type="search"
                    value={search}
                    disabled={busy}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by title or description"
                  />
                  <Button type="submit" variant="outline" disabled={busy}>
                    <Search /> Search
                  </Button>
                </div>
              </Field>
            </form>
            <Field id="catalog-category" label="Category">
              <CategorySelect
                id="catalog-category"
                emptyLabel="All categories"
                categories={categories.data ?? []}
                disabled={busy || !categories.data}
                value={filters.categoryId ?? ""}
                onChange={(event) => {
                  const categoryId = event.target.value || undefined;
                  setFilters((current) => ({
                    ...current,
                    page: 1,
                    categoryId,
                  }));
                }}
              />
            </Field>
          </div>
        </CardContent>
      </Card>
      {categories.error && (
        <AdminError
          error={categories.error}
          retry={() => void categories.refetch()}
        />
      )}
      {query.isPending && <AdminLoading />}
      {query.error && (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      )}
      {query.data && (
        <Card>
          <CardContent className="space-y-4">
            {query.data.data.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {[
                      "Product",
                      "Category",
                      "Price",
                      "Stock",
                      "Featured",
                      "Active",
                      "Actions",
                    ].map((title) => (
                      <TableHead key={title}>{title}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.data.map((product) => {
                    const href = `/admin/products/${encodeURIComponent(product.id)}/edit`;
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <CatalogImage url={product.thumbnail} alt="" />
                            <div>
                              <Link
                                href={href}
                                className="block max-w-56 whitespace-normal font-semibold hover:underline"
                              >
                                {product.title}
                              </Link>
                              {product.sku && (
                                <p className="text-xs text-muted-foreground">
                                  {product.sku}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.category?.name ??
                            categoryNames.get(product.categoryId) ??
                            "—"}
                        </TableCell>
                        <TableCell>
                          <div className="tabular-nums">
                            {product.discountPrice == null ? (
                              money.format(product.basePrice)
                            ) : (
                              <>
                                <span className="font-medium">
                                  {money.format(product.discountPrice)}
                                </span>
                                <span className="ml-2 text-xs text-muted-foreground line-through">
                                  {money.format(product.basePrice)}
                                </span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{product.stock}</span>
                            {product.stock <= 5 && (
                              <Badge
                                variant={
                                  product.stock === 0
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {product.stock === 0
                                  ? "Out of stock"
                                  : "Low stock"}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Toggle
                            label={`Feature ${product.title}`}
                            hideLabel
                            checked={product.isFeatured}
                            disabled={busy}
                            onChange={(value) =>
                              toggle(product, "isFeatured", value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Toggle
                            label={`Activate ${product.title}`}
                            hideLabel
                            checked={product.isActive}
                            disabled={busy}
                            onChange={(value) =>
                              toggle(product, "isActive", value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Link
                              href={href}
                              className={buttonVariants({
                                variant: "ghost",
                                size: "icon-sm",
                              })}
                              aria-label={`Edit ${product.title}`}
                            >
                              <Pencil />
                            </Link>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={busy}
                              aria-label={`Delete ${product.title}`}
                              onClick={() => remove(product)}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">
                No products match your filters.
              </p>
            )}
            {meta && (
              <nav
                aria-label="Product pages"
                className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm"
              >
                <span className="text-muted-foreground">
                  {meta.total} {meta.total === 1 ? "product" : "products"}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Previous page"
                    disabled={busy || page <= 1}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: Math.min(page - 1, lastPage),
                      }))
                    }
                  >
                    <ChevronLeft />
                  </Button>
                  <span>
                    Page {page} of {lastPage}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Next page"
                    disabled={busy || page >= lastPage}
                    onClick={() =>
                      setFilters((current) => ({ ...current, page: page + 1 }))
                    }
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </nav>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
