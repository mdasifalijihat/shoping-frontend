"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  createCustomPage,
  deleteCustomPage,
  getAllCustomPages,
  updateCustomPage,
} from "@/app/services/siteSetting.service";
import type { ICustomPage } from "@/app/types/navbar.types";
import {
  AdminError,
  AdminHeading,
  AdminLoading,
  Field,
  Toggle,
  useAdminAction,
} from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const pagesKey = ["admin", "custom-pages"] as const;
type PageFields = Pick<ICustomPage, "title" | "slug" | "content" | "isActive">;

export default function CustomPagesPage() {
  const query = useQuery({ queryKey: pagesKey, queryFn: getAllCustomPages });
  const cache = useQueryClient();
  const { busy, run } = useAdminAction();
  const [editing, setEditing] = useState<string | null>(null);

  function save(fields: PageFields, page?: ICustomPage) {
    void run(
      async () => {
        const saved = page
          ? await updateCustomPage(page.id, fields)
          : await createCustomPage(fields);
        cache.setQueryData<ICustomPage[]>(pagesKey, (current = []) =>
          [...current.filter(({ id }) => id !== saved.id), saved].sort((a, b) =>
            a.title.localeCompare(b.title),
          ),
        );
        void cache.invalidateQueries({
          queryKey: ["admin", "public-page-links"],
        });
        setEditing(null);
      },
      page ? "Page updated." : "Page created.",
    );
  }

  function remove(page: ICustomPage) {
    if (!window.confirm(`Delete ?${page.title}??`)) return;
    void run(async () => {
      await deleteCustomPage(page.id);
      cache.setQueryData<ICustomPage[]>(pagesKey, (current) =>
        current?.filter(({ id }) => id !== page.id),
      );
      void cache.invalidateQueries({
        queryKey: ["admin", "public-page-links"],
      });
    }, "Page deleted.");
  }

  return (
    <>
      <AdminHeading
        title="Custom Pages"
        description="Create and publish standalone pages for the store."
      />
      {query.isPending && <AdminLoading />}
      {query.error && (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      )}
      {query.data && (
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Store pages</CardTitle>
            <Button
              type="button"
              disabled={busy || editing !== null}
              onClick={() => setEditing("new")}
            >
              <Plus aria-hidden="true" /> Add page
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing === "new" && (
              <PageForm
                busy={busy}
                onSave={save}
                onCancel={() => setEditing(null)}
              />
            )}
            {query.data.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No custom pages yet.
              </p>
            )}
            {query.data.map((page) => (
              <section key={page.id} className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-3">
                  <div className="min-w-32 flex-1">
                    <h2 className="break-words text-sm font-medium">
                      {page.title}
                    </h2>
                    <p className="break-all text-xs text-muted-foreground">
                      /page/{page.slug}
                    </p>
                  </div>
                  <Badge variant={page.isActive ? "secondary" : "outline"}>
                    {page.isActive ? "Published" : "Draft"}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={busy || editing !== null}
                    aria-label={`Edit ${page.title}`}
                    onClick={() => setEditing(page.id)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={busy || editing !== null}
                    aria-label={`Delete ${page.title}`}
                    onClick={() => remove(page)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
                {editing === page.id && (
                  <PageForm
                    page={page}
                    busy={busy}
                    onSave={(fields) => save(fields, page)}
                    onCancel={() => setEditing(null)}
                  />
                )}
              </section>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function slugify(title: string) {
  return title
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 100)
    .replace(/^-+|-+$/g, "");
}

function PageForm({
  page,
  busy,
  onSave,
  onCancel,
}: {
  page?: ICustomPage;
  busy: boolean;
  onSave: (fields: PageFields) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [title, setTitle] = useState(page?.title ?? "");
  const [slugOverride, setSlugOverride] = useState<string | undefined>(
    page?.slug,
  );
  const [active, setActive] = useState(page?.isActive ?? false);
  const slug = slugOverride ?? slugify(title);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return toast.error("Enter a page title.");
    const data = new FormData(event.currentTarget);
    onSave({
      title: title.trim(),
      slug,
      content: String(data.get("content")),
      isActive: active,
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
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </Field>
        <Field id={`${id}-slug`} label="Slug">
          <Input
            id={`${id}-slug`}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            value={slug}
            onChange={(event) => setSlugOverride(event.target.value)}
            required
            aria-describedby={`${id}-preview`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <p
              id={`${id}-preview`}
              className="break-all text-xs text-muted-foreground"
            >
              /page/{slug || "your-page"}
            </p>
            {slugOverride !== undefined && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setSlugOverride(undefined)}
              >
                Generate from title
              </Button>
            )}
          </div>
        </Field>
        <div className="sm:col-span-2">
          <Field id={`${id}-content`} label="Page content">
            <Textarea
              id={`${id}-content`}
              name="content"
              defaultValue={page?.content}
              className="min-h-48"
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Toggle
            label="Published"
            checked={active}
            onChange={setActive}
            disabled={busy}
          />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit">
            {busy ? "Saving?" : page ? "Save changes" : "Create page"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
