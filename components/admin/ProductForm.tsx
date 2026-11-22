"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Images, LoaderCircle, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";

import { uploadMultipleImages } from "@/app/services/media.service";
import {
  createProduct,
  updateProduct,
  type ProductInput,
} from "@/app/services/product.service";
import type { IProduct } from "@/app/types/catalog.types";
import {
  AdminError,
  AdminHeading,
  AdminLoading,
  Field,
  Toggle,
  useAdminAction,
} from "@/components/admin/admin-ui";
import {
  adminCategoriesQuery,
  attributesQuery,
  CatalogImage,
  CategorySelect,
  productKey,
  productListKey,
} from "@/components/admin/catalog-ui";
import {
  SpecFields,
  VariantEditor,
  readPrice,
  readSpecs,
  readStock,
  readVariants,
  toSpecs,
  toVariantDrafts,
} from "@/components/admin/product-options";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const galleryTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ProductForm({ product }: { product?: IProduct }) {
  const categories = useQuery(adminCategoriesQuery);
  const attributes = useQuery(attributesQuery);
  const cache = useQueryClient();
  const router = useRouter();
  const { busy, run } = useAdminAction();
  const [thumbnail, setThumbnail] = useState(product?.thumbnail ?? "");
  const [images, setImages] = useState(product?.images ?? []);
  const [thumbnailPending, setThumbnailPending] = useState(false);
  const [galleryPending, setGalleryPending] = useState(false);
  const galleryLock = useRef(false);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [featured, setFeatured] = useState(product?.isFeatured ?? false);
  const [active, setActive] = useState(product?.isActive ?? true);
  const [specs, setSpecs] = useState(() =>
    toSpecs(product?.customAttributes ?? {}),
  );
  const [variants, setVariants] = useState(() =>
    toVariantDrafts(product?.variants ?? []),
  );
  const [sku, setSku] = useState(product?.sku ?? "");
  const [basePrice, setBasePrice] = useState(
    product ? String(product.basePrice) : "",
  );
  const [discount, setDiscount] = useState(
    product?.discountPrice == null ? "" : String(product.discountPrice),
  );
  const uploading = thumbnailPending || galleryPending;
  const title = product ? "Edit product" : "Add product";

  async function uploadGallery(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!files.length || galleryLock.current || busy) return;
    if (
      files.length > 10 ||
      files.some(
        (file) =>
          !galleryTypes.includes(file.type) || file.size > 5 * 1024 * 1024,
      )
    ) {
      toast.error(
        "Choose up to 10 JPEG, PNG, WebP, or GIF images of 5 MB each.",
      );
      return;
    }
    galleryLock.current = true;
    setGalleryPending(true);
    try {
      const uploaded = await uploadMultipleImages(files);
      setImages((current) => [...current, ...uploaded.map(({ url }) => url)]);
      toast.success(
        `Uploaded ${uploaded.length} ${uploaded.length === 1 ? "image" : "images"}.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not upload gallery images.",
      );
    } finally {
      galleryLock.current = false;
      setGalleryPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading || galleryLock.current || !categories.data) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("title") ?? "").trim();
    const categoryId = String(data.get("categoryId") ?? "");
    if (!name || !categoryId || !thumbnail)
      return toast.error("Add a title, category, and thumbnail.");
    let input: ProductInput;
    try {
      const price = readPrice(basePrice, "Base price");
      const discountPrice = discount
        ? readPrice(discount, "Discount price")
        : null;
      if (discountPrice !== null && discountPrice > price)
        throw new Error("Discount price cannot exceed base price.");
      input = {
        title: name,
        categoryId,
        description: String(data.get("description") ?? ""),
        sku: sku.trim() || null,
        basePrice: price,
        discountPrice,
        stock: readStock(String(data.get("stock") ?? ""), "Stock"),
        thumbnail,
        images,
        customAttributes: readSpecs(specs, "product specifications"),
        variants: readVariants(variants),
        isFeatured: featured,
        isActive: active,
      };
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Review the product fields.",
      );
      return;
    }

    void run(
      async () => {
        const changes = product
          ? (Object.fromEntries(
              Object.entries(input).filter(
                ([key, value]) =>
                  JSON.stringify(value) !==
                  JSON.stringify(
                    key === "variants"
                      ? readVariants(toVariantDrafts(product.variants))
                      : product[key as keyof ProductInput],
                  ),
              ),
            ) as Partial<ProductInput>)
          : input;
        if (product && !Object.keys(changes).length) {
          router.push("/admin/products");
          return "No product changes to save.";
        }
        const saved = product
          ? await updateProduct(product.id, changes)
          : await createProduct(input);
        cache.setQueryData(productKey(saved.id), saved);
        await Promise.all([
          cache.invalidateQueries({ queryKey: productListKey }),
          cache.invalidateQueries({ queryKey: adminCategoriesQuery.queryKey }),
          cache.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
        ]);
        router.push("/admin/products");
      },
      product ? "Product updated." : "Product created.",
    );
  }

  return (
    <>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Products
      </Link>
      <AdminHeading
        title={title}
        description="Manage product details, media, specifications, and variants."
      />
      {categories.isPending && <AdminLoading />}
      {categories.error && (
        <AdminError
          error={categories.error}
          retry={() => void categories.refetch()}
        />
      )}
      {categories.data && (
        <form method="post" onSubmit={submit}>
          <fieldset disabled={busy} className="min-w-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field id="product-title" label="Title">
                  <Input
                    id="product-title"
                    name="title"
                    required
                    defaultValue={product?.title}
                  />
                </Field>
                <Field id="product-category" label="Category">
                  <CategorySelect
                    id="product-category"
                    name="categoryId"
                    emptyLabel="Choose a category"
                    categories={categories.data}
                    required
                    defaultValue={product?.categoryId ?? ""}
                  />
                </Field>
                <Field id="product-sku" label="SKU">
                  <Input
                    id="product-sku"
                    value={sku}
                    onChange={(event) => setSku(event.target.value)}
                  />
                </Field>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Field id="product-description" label="Description">
                    <Textarea
                      id="product-description"
                      name="description"
                      className="min-h-28"
                      defaultValue={product?.description}
                    />
                  </Field>
                </div>
                <Field id="product-price" label="Base price">
                  <Input
                    id="product-price"
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={basePrice}
                    onChange={(event) => setBasePrice(event.target.value)}
                  />
                </Field>
                <Field id="product-discount" label="Discount price">
                  <Input
                    id="product-discount"
                    type="number"
                    min="0"
                    step="any"
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                  />
                </Field>
                <Field id="product-stock" label="Total stock">
                  <Input
                    id="product-stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    required
                    defaultValue={product?.stock ?? 0}
                  />
                </Field>
                <div className="flex flex-wrap gap-5 sm:col-span-2 lg:col-span-3">
                  <Toggle
                    label="Featured"
                    checked={featured}
                    onChange={setFeatured}
                  />
                  <Toggle
                    label="Active"
                    checked={active}
                    onChange={setActive}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Media gallery</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div className="space-y-2" role="group" aria-label="Thumbnail">
                  <p className="text-sm font-medium">Thumbnail</p>
                  <ImageUploader
                    value={thumbnail}
                    onChange={setThumbnail}
                    onUploadStateChange={setThumbnailPending}
                  />
                  {thumbnail && (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={thumbnailPending}
                      onClick={() => setThumbnail("")}
                    >
                      Remove thumbnail
                    </Button>
                  )}
                </div>
                <div
                  className="min-w-0 space-y-3"
                  role="group"
                  aria-label="Gallery images"
                >
                  <p className="text-sm font-medium">Gallery images</p>
                  {images.length > 0 && (
                    <ul className="flex flex-wrap gap-3">
                      {images.map((url, index) => (
                        <li key={`${url}-${index}`} className="relative">
                          <CatalogImage
                            url={url}
                            alt={`Gallery image ${index + 1}`}
                            className="size-20"
                            sizes="80px"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon-xs"
                            className="absolute top-1 right-1"
                            aria-label={`Remove gallery image ${index + 1}`}
                            onClick={() =>
                              setImages((current) =>
                                current.filter(
                                  (_, position) => position !== index,
                                ),
                              )
                            }
                          >
                            <X />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <input
                    ref={galleryInput}
                    type="file"
                    accept={galleryTypes.join(",")}
                    multiple
                    hidden
                    onChange={(event) => void uploadGallery(event)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={galleryPending}
                    aria-busy={galleryPending}
                    onClick={() => galleryInput.current?.click()}
                  >
                    {galleryPending ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <Images />
                    )}
                    {galleryPending ? "Uploading..." : "Upload gallery images"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Custom specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <SpecFields
                  specs={specs}
                  onChange={setSpecs}
                  addLabel="Add Custom Field"
                  prefix="Specification"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Variants</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {attributes.isPending && <AdminLoading />}
                {attributes.error && (
                  <AdminError
                    error={attributes.error}
                    retry={() => void attributes.refetch()}
                  />
                )}
                <VariantEditor
                  templates={attributes.data ?? []}
                  drafts={variants}
                  onChange={setVariants}
                  getDefaults={() => ({
                    sku: sku.trim() || "",
                    price: discount || basePrice,
                  })}
                />
              </CardContent>
            </Card>
            <div className="flex flex-wrap justify-end gap-2">
              <Link
                href="/admin/products"
                className={buttonVariants({ variant: "outline" })}
              >
                Cancel
              </Link>
              <Button type="submit" disabled={uploading}>
                {busy
                  ? "Saving..."
                  : product
                    ? "Save changes"
                    : "Create product"}
              </Button>
            </div>
          </fieldset>
        </form>
      )}
    </>
  );
}
