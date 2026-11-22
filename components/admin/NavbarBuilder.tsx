"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { getPublicCategories } from "@/app/services/category.service";
import {
  createNavbarItem,
  deleteNavbarItem,
  getAdminNavbar,
  reorderNavbarItems,
  updateNavbarItem,
  type NavbarInput,
} from "@/app/services/navbar.service";
import { getPublicPageLinks } from "@/app/services/siteSetting.service";
import type { INavbarItem } from "@/app/types/navbar.types";
import {
  AdminError,
  AdminHeading,
  AdminLoading,
  Field,
  SelectField,
  Toggle,
  flattenTree,
  useAdminAction,
} from "@/components/admin/admin-ui";
import { SortableList } from "@/components/admin/sortable-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const navbarKey = ["admin", "navbar"] as const;

function groupByParent(items: INavbarItem[]) {
  const groups = new Map<string | null, INavbarItem[]>();
  for (const item of items) {
    const siblings = groups.get(item.parentId);
    if (siblings) siblings.push(item);
    else groups.set(item.parentId, [item]);
  }
  return groups;
}

function rebuildTree(items: INavbarItem[]) {
  const groups = groupByParent(items);

  function branch(parentId: string | null): INavbarItem[] {
    return (groups.get(parentId) ?? [])
      .sort((a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id))
      .map((item) => ({ ...item, children: branch(item.id) }));
  }

  return branch(null);
}

export function NavbarBuilder() {
  const query = useQuery({ queryKey: navbarKey, queryFn: getAdminNavbar });
  const cache = useQueryClient();
  const { busy, run } = useAdminAction();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Map<string | null, INavbarItem[]>>();
  const flat = flattenTree(query.data ?? []);
  const groups = draft ?? groupByParent(flat.map(({ item }) => item));

  function updateTree(update: (items: INavbarItem[]) => INavbarItem[]) {
    cache.setQueryData<INavbarItem[]>(navbarKey, (current = []) =>
      rebuildTree(update(flattenTree(current).map(({ item }) => item))),
    );
  }

  function saveItem(fields: NavbarInput, item?: INavbarItem) {
    void run(
      async () => {
        const moving = !item || item.parentId !== fields.parentId;
        const siblings = groups.get(fields.parentId ?? null) ?? [];
        const orderIndex = moving
          ? Math.max(-1, ...siblings.map((sibling) => sibling.orderIndex)) + 1
          : item.orderIndex;
        const saved = item
          ? await updateNavbarItem(item.id, { ...fields, orderIndex })
          : await createNavbarItem({ ...fields, orderIndex });
        updateTree((current) => [
          ...current.filter(({ id }) => id !== saved.id),
          saved,
        ]);
        setEditing(null);
      },
      item ? "Menu item updated." : "Menu item created.",
    );
  }

  function removeItem(item: INavbarItem) {
    const message = item.children?.length
      ? `Delete ?${item.title}? and all its sub-menu items?`
      : `Delete ?${item.title}??`;
    if (!window.confirm(message)) return;
    void run(async () => {
      const removed = new Set(
        flattenTree([item]).map(({ item: node }) => node.id),
      );
      await deleteNavbarItem(item.id);
      updateTree((current) => current.filter(({ id }) => !removed.has(id)));
    }, "Menu item deleted.");
  }

  function saveOrder() {
    if (!draft) return;
    void run(async () => {
      const positions = [...draft.values()].flatMap((siblings) =>
        siblings.map(({ id }, orderIndex) => ({ id, orderIndex })),
      );
      const saved = await reorderNavbarItems(positions);
      const entries = new Map(saved.map((item) => [item.id, item]));
      updateTree((current) =>
        current.map((item) => entries.get(item.id) ?? item),
      );
      setDraft(undefined);
    }, "Menu order saved.");
  }

  function renderBranch(parentId: string | null, depth = 0) {
    const siblings = groups.get(parentId);
    if (!siblings?.length) return null;
    return (
      <SortableList
        items={siblings}
        disabled={busy || editing !== null}
        onReorder={(ordered) => {
          const next = new Map(groups);
          next.set(parentId, ordered);
          setDraft(next);
        }}
        renderItem={(item, handle) => (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-2 sm:flex-nowrap">
              {handle}
              <div className="min-w-0 flex-1 basis-28">
                <div className="truncate text-sm font-medium">{item.title}</div>
                {item.url && (
                  <div className="truncate text-xs text-muted-foreground">
                    {item.url}
                  </div>
                )}
              </div>
              <Badge variant={item.isActive ? "secondary" : "outline"}>
                {item.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${item.title}`}
                disabled={busy || !!draft || editing !== null}
                onClick={() => setEditing(item.id)}
              >
                <Pencil aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${item.title}`}
                disabled={busy || !!draft || editing !== null}
                onClick={() => removeItem(item)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
            {editing === item.id && (
              <NavbarForm
                key={item.id}
                item={item}
                parents={flat}
                busy={busy}
                onSave={(fields) => saveItem(fields, item)}
                onCancel={() => setEditing(null)}
              />
            )}
            {groups.has(item.id) && (
              <div
                className={
                  depth < 4
                    ? "ml-2 border-l pl-2 sm:ml-4 sm:pl-4"
                    : "border-l pl-1"
                }
              >
                {renderBranch(item.id, depth + 1)}
              </div>
            )}
          </div>
        )}
      />
    );
  }

  return (
    <>
      <AdminHeading
        title="Navbar Builder"
        description="Manage store navigation and drag items within the same menu level to reorder them."
      />
      {query.isPending && <AdminLoading />}
      {query.error && (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      )}
      {query.data && (
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Menu items</CardTitle>
            <div className="flex flex-wrap gap-2">
              {draft && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setDraft(undefined)}
                >
                  Discard order
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={busy || !draft}
                onClick={saveOrder}
              >
                Save Order
              </Button>
              <Button
                type="button"
                disabled={busy || !!draft || editing !== null}
                onClick={() => setEditing("new")}
              >
                <Plus aria-hidden="true" /> Add item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing === "new" && (
              <NavbarForm
                parents={flat}
                busy={busy}
                onSave={saveItem}
                onCancel={() => setEditing(null)}
              />
            )}
            {flat.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No menu items yet.
              </p>
            )}
            {renderBranch(null)}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function NavbarForm({
  item,
  parents,
  busy,
  onSave,
  onCancel,
}: {
  item?: INavbarItem;
  parents: ReturnType<typeof flattenTree<INavbarItem>>;
  busy: boolean;
  onSave: (fields: NavbarInput) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [url, setUrl] = useState(item?.url ?? "");
  const [active, setActive] = useState(item?.isActive ?? true);
  const [newTab, setNewTab] = useState(item?.openInNew ?? false);
  const categories = useQuery({
    queryKey: ["admin", "public-categories"],
    queryFn: () => getPublicCategories(),
  });
  const pages = useQuery({
    queryKey: ["admin", "public-page-links"],
    queryFn: getPublicPageLinks,
  });
  const linkError = categories.error ?? pages.error;
  const excluded = new Set(
    item ? flattenTree([item]).map(({ item: node }) => node.id) : [],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title")).trim();
    if (!title) return toast.error("Enter a menu title.");
    onSave({
      title,
      url: url.trim() || null,
      parentId: String(data.get("parentId") ?? "") || null,
      icon: String(data.get("icon") ?? "").trim() || null,
      isActive: active,
      openInNew: newTab,
    });
  }

  return (
    <form
      method="post"
      onSubmit={submit}
      className="rounded-lg border bg-muted/35 p-3 sm:p-4"
    >
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <Field id={`${id}-title`} label="Title">
          <Input
            id={`${id}-title`}
            name="title"
            defaultValue={item?.title}
            required
          />
        </Field>
        <Field id={`${id}-parent`} label="Parent menu">
          <SelectField
            id={`${id}-parent`}
            name="parentId"
            defaultValue={item?.parentId ?? ""}
          >
            <option value="">Top level</option>
            {parents
              .filter(({ item: node }) => !excluded.has(node.id))
              .map(({ item: node, depth }) => (
                <option key={node.id} value={node.id}>
                  {`? `.repeat(depth)}
                  {node.title}
                </option>
              ))}
          </SelectField>
        </Field>
        <Field id={`${id}-url`} label="Link URL">
          <Input
            id={`${id}-url`}
            placeholder="/products or https://example.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </Field>
        <Field id={`${id}-links`} label="Choose a store link">
          <SelectField
            id={`${id}-links`}
            value=""
            onChange={(event) => {
              if (event.target.value) setUrl(event.target.value);
            }}
          >
            <option value="">
              {categories.isPending || pages.isPending
                ? "Loading store links?"
                : "Select a category or page"}
            </option>
            <optgroup label="Categories">
              {flattenTree(categories.data ?? []).map(
                ({ item: category, depth }) => (
                  <option
                    key={category.id}
                    value={`/category/${category.slug}`}
                  >
                    {`? `.repeat(depth)}
                    {category.name}
                  </option>
                ),
              )}
            </optgroup>
            <optgroup label="Custom pages">
              {pages.data?.map((page) => (
                <option key={page.id} value={`/page/${page.slug}`}>
                  {page.title}
                </option>
              ))}
            </optgroup>
          </SelectField>
        </Field>
        {linkError && (
          <div className="sm:col-span-2">
            <AdminError
              error={linkError}
              retry={() => {
                if (categories.error) void categories.refetch();
                if (pages.error) void pages.refetch();
              }}
            />
          </div>
        )}
        <Field id={`${id}-icon`} label="Icon name">
          <Input
            id={`${id}-icon`}
            name="icon"
            defaultValue={item?.icon ?? ""}
            placeholder="ShoppingBag"
          />
        </Field>
        <div className="flex flex-wrap items-end gap-5 pb-1">
          <Toggle
            checked={active}
            onChange={setActive}
            label="Active"
            disabled={busy}
          />
          <Toggle
            checked={newTab}
            onChange={setNewTab}
            label="Open in new tab"
            disabled={busy}
          />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit">
            {busy ? "Saving?" : item ? "Save changes" : "Create item"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
