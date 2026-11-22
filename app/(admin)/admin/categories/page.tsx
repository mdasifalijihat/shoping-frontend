"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryInput,
} from "@/app/services/category.service";
import type { ICategory } from "@/app/types/catalog.types";
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
  catalogSlug,
} from "@/components/admin/catalog-ui";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export default function CategoriesPage() {
  const query = useQuery(adminCategoriesQuery);
  const cache = useQueryClient();
  const { busy, run } = useAdminAction();
  const [editor, setEditor] = useState<{
    category?: ICategory;
    parentId?: string;
  } | null>(null);
  const [iconPending, setIconPending] = useState(false);
  const [bannerPending, setBannerPending] = useState(false);
  const uploading = iconPending || bannerPending;
  const flat = flattenTree(query.data ?? []);
  const names = new Map(flat.map(({ item }) => [item.id, item.name]));

  async function refresh() {
    await Promise.all([
      cache.invalidateQueries({ queryKey: adminCategoriesQuery.queryKey }),
      cache.invalidateQueries({ queryKey: ["admin", "public-categories"] }),
      cache.invalidateQueries({ queryKey: ["admin", "products"] }),
    ]);
  }

  function toggle(
    category: ICategory,
    key: "isActive" | "isFeatured",
    value: boolean,
  ) {
    void run(async () => {
      await updateCategory(category.id, { [key]: value });
      await refresh();
    }, "Category updated.");
  }

  function remove(category: ICategory) {
    const warning = category.children?.length
      ? " Its direct subcategories will move to the top level."
      : "";
    if (!window.confirm(`Delete "${category.name}"?${warning}`)) return;
    void run(async () => {
      await deleteCategory(category.id);
      await refresh();
    }, "Category deleted.");
  }

  function save(data: CategoryInput) {
    const current = editor?.category;
    void run(
      async () => {
        if (current) await updateCategory(current.id, data);
        else await createCategory(data);
        setEditor(null);
        await refresh();
      },
      current ? "Category updated." : "Category created.",
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-4">
        <AdminHeading
          title="Categories"
          description="Manage your catalog hierarchy, imagery, and storefront visibility."
        />
        <Button
          type="button"
          disabled={busy || !query.data}
          onClick={() => setEditor({})}
        >
          <Plus /> Add category
        </Button>
      </div>
      {query.isPending && <AdminLoading />}
      {query.error && (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      )}
      {query.data && (
        <Card>
          <CardContent>
            {!flat.length ? (
              <p className="py-4 text-sm text-muted-foreground">
                No categories yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {[
                      "Category",
                      "Slug",
                      "Parent",
                      "Products",
                      "Featured",
                      "Active",
                      "Actions",
                    ].map((title) => (
                      <TableHead key={title}>{title}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flat.map(({ item, depth }) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div
                          className="flex items-center gap-2"
                          style={{
                            paddingInlineStart: Math.min(depth, 8) * 12,
                          }}
                        >
                          {depth > 0 && (
                            <span
                              aria-hidden="true"
                              className="text-muted-foreground"
                            >
                              ↳
                            </span>
                          )}
                          <CatalogImage
                            url={item.iconUrl}
                            alt=""
                            className="size-9"
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.slug}
                      </TableCell>
                      <TableCell>
                        {item.parentId
                          ? (names.get(item.parentId) ?? "—")
                          : "—"}
                      </TableCell>
                      <TableCell>{item._count?.products ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Toggle
                            label={`Feature ${item.name}`}
                            hideLabel
                            checked={item.isFeatured}
                            disabled={busy}
                            onChange={(value) =>
                              toggle(item, "isFeatured", value)
                            }
                          />
                          {item.isFeatured && (
                            <Badge variant="secondary">Featured</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Toggle
                          label={`Activate ${item.name}`}
                          hideLabel
                          checked={item.isActive}
                          disabled={busy}
                          onChange={(value) => toggle(item, "isActive", value)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={busy}
                            aria-label={`Add subcategory to ${item.name}`}
                            onClick={() => setEditor({ parentId: item.id })}
                          >
                            <Plus />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={busy}
                            aria-label={`Edit ${item.name}`}
                            onClick={() => setEditor({ category: item })}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={busy}
                            aria-label={`Delete ${item.name}`}
                            onClick={() => remove(item)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open && !busy && !uploading) setEditor(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editor?.category ? "Edit category" : "Add category"}
            </DialogTitle>
            <DialogDescription>
              Choose a parent to place this category inside another category.
            </DialogDescription>
          </DialogHeader>
          {editor && (
            <CategoryForm
              category={editor.category}
              initialParent={editor.parentId}
              categories={query.data ?? []}
              busy={busy}
              uploading={uploading}
              onIconPending={setIconPending}
              onBannerPending={setBannerPending}
              onSave={save}
              onCancel={() => setEditor(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoryForm({
  category,
  initialParent,
  categories,
  busy,
  uploading,
  onIconPending,
  onBannerPending,
  onSave,
  onCancel,
}: {
  category?: ICategory;
  initialParent?: string;
  categories: ICategory[];
  busy: boolean;
  uploading: boolean;
  onIconPending: (value: boolean) => void;
  onBannerPending: (value: boolean) => void;
  onSave: (value: CategoryInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [slugOverride, setSlugOverride] = useState<string | undefined>(
    category?.slug,
  );
  const [iconUrl, setIcon] = useState(category?.iconUrl ?? "");
  const [bannerUrl, setBanner] = useState(category?.bannerUrl ?? "");
  const [featured, setFeatured] = useState(category?.isFeatured ?? false);
  const [active, setActive] = useState(category?.isActive ?? true);
  const slug = slugOverride ?? catalogSlug(name);
  const excluded = new Set(
    category ? flattenTree([category]).map(({ item }) => item.id) : [],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading) return;
    if (!name.trim()) return toast.error("Enter a category name.");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug === "admin")
      return toast.error(
        "Enter an available slug using lowercase letters, numbers, and hyphens.",
      );
    const form = new FormData(event.currentTarget);
    const parentId = String(form.get("parentId") ?? "") || null;
    const orderIndex =
      !category || parentId !== category.parentId
        ? Math.max(
            -1,
            ...flattenTree(categories)
              .filter(({ item }) => item.parentId === parentId)
              .map(({ item }) => item.orderIndex),
          ) + 1
        : undefined;
    onSave({
      name: name.trim(),
      slug,
      parentId,
      description: String(form.get("description") ?? "").trim() || null,
      iconUrl: iconUrl || null,
      bannerUrl: bannerUrl || null,
      isFeatured: featured,
      isActive: active,
      orderIndex,
    });
  }

  return (
    <form method="post" onSubmit={submit}>
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <Field id="category-name" label="Name">
          <Input
            id="category-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field id="category-slug" label="Slug">
          <Input
            id="category-slug"
            required
            value={slug}
            onChange={(event) => setSlugOverride(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-1">
            <p className="break-all text-xs text-muted-foreground">
              /category/{slug || "your-category"}
            </p>
            {slugOverride !== undefined && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setSlugOverride(undefined)}
              >
                Generate from name
              </Button>
            )}
          </div>
        </Field>
        <div className="sm:col-span-2">
          <Field id="category-parent" label="Parent category">
            <CategorySelect
              id="category-parent"
              name="parentId"
              categories={categories}
              excluded={excluded}
              emptyLabel="Top level"
              defaultValue={category?.parentId ?? initialParent ?? ""}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="category-description" label="Description">
            <Textarea
              id="category-description"
              name="description"
              defaultValue={category?.description ?? ""}
            />
          </Field>
        </div>
        <div role="group" aria-label="Category icon" className="space-y-2">
          <p className="text-sm font-medium">Icon</p>
          <ImageUploader
            value={iconUrl}
            onChange={setIcon}
            onUploadStateChange={onIconPending}
          />
          {iconUrl && (
            <Button
              type="button"
              variant="ghost"
              disabled={uploading}
              onClick={() => setIcon("")}
            >
              Remove icon
            </Button>
          )}
        </div>
        <div role="group" aria-label="Category banner" className="space-y-2">
          <p className="text-sm font-medium">Banner</p>
          <ImageUploader
            value={bannerUrl}
            onChange={setBanner}
            onUploadStateChange={onBannerPending}
          />
          {bannerUrl && (
            <Button
              type="button"
              variant="ghost"
              disabled={uploading}
              onClick={() => setBanner("")}
            >
              Remove banner
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-5 sm:col-span-2">
          <Toggle label="Featured" checked={featured} onChange={setFeatured} />
          <Toggle label="Active" checked={active} onChange={setActive} />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={uploading}>
            {busy ? "Saving..." : category ? "Save changes" : "Create category"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
