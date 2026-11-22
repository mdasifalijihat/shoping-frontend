"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  createHomepageSection,
  deleteHomepageSection,
  getAdminHomepageSections,
  reorderHomepageSections,
  updateHomepageSection,
} from "@/app/services/siteSetting.service";
import type { IHomepageSection, SectionType } from "@/app/types/navbar.types";
import type { JsonObject } from "@/app/types/api.types";
import {
  AdminError,
  AdminHeading,
  AdminLoading,
  Field,
  SelectField,
  Toggle,
  useAdminAction,
} from "@/components/admin/admin-ui";
import {
  SectionConfig,
  sectionLabels,
} from "@/components/admin/homepage-config";
import { jsonObject } from "@/components/admin/json-fields";
import { SortableList } from "@/components/admin/sortable-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const key = ["admin", "homepage-sections"] as const;
type SectionFields = Pick<
  IHomepageSection,
  "title" | "subtitle" | "type" | "isActive" | "config"
>;

export function HomepageBuilder() {
  const query = useQuery({ queryKey: key, queryFn: getAdminHomepageSections });
  const cache = useQueryClient();
  const { busy, run } = useAdminAction();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<IHomepageSection[]>();
  const sections = draft ?? query.data ?? [];

  function replaceSection(section: IHomepageSection) {
    cache.setQueryData<IHomepageSection[]>(key, (current = []) =>
      current.some(({ id }) => id === section.id)
        ? current.map((entry) => (entry.id === section.id ? section : entry))
        : [...current, section],
    );
  }

  function save(fields: SectionFields, current?: IHomepageSection) {
    void run(
      async () => {
        const orderIndex =
          Math.max(-1, ...sections.map((section) => section.orderIndex)) + 1;
        const saved = current
          ? await updateHomepageSection(current.id, fields)
          : await createHomepageSection({ ...fields, orderIndex });
        replaceSection(saved);
        setEditing(null);
      },
      current ? "Section updated." : "Section created.",
    );
  }

  function remove(section: IHomepageSection) {
    if (!window.confirm(`Delete ?${section.title}??`)) return;
    void run(async () => {
      await deleteHomepageSection(section.id);
      cache.setQueryData<IHomepageSection[]>(key, (current) =>
        current?.filter(({ id }) => id !== section.id),
      );
    }, "Section deleted.");
  }

  function saveOrder() {
    if (!draft) return;
    void run(async () => {
      const saved = await reorderHomepageSections(
        draft.map(({ id }, orderIndex) => ({ id, orderIndex })),
      );
      cache.setQueryData(
        key,
        [...saved].sort(
          (first, second) => first.orderIndex - second.orderIndex,
        ),
      );
      setDraft(undefined);
    }, "Section order saved.");
  }

  return (
    <>
      <AdminHeading
        title="Homepage Builder"
        description="Choose which sections appear on the homepage and drag them into order."
      />
      {query.isPending && <AdminLoading />}
      {query.error && (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      )}
      {query.data && (
        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Homepage sections</CardTitle>
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
                <Plus aria-hidden="true" /> Add section
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing === "new" && (
              <SectionForm
                busy={busy}
                onSave={save}
                onCancel={() => setEditing(null)}
              />
            )}
            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No homepage sections yet.
              </p>
            )}
            <SortableList
              items={sections}
              disabled={busy || editing !== null}
              onReorder={setDraft}
              renderItem={(section, handle) => (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-2 sm:gap-3">
                    {handle}
                    <div className="min-w-32 flex-1">
                      <div className="text-sm font-medium">{section.title}</div>
                      <Badge variant="outline">
                        {sectionLabels[section.type]}
                      </Badge>
                    </div>
                    <Toggle
                      label="Active"
                      checked={section.isActive}
                      disabled={busy || !!draft || editing !== null}
                      onChange={(isActive) =>
                        void run(
                          async () => {
                            replaceSection(
                              await updateHomepageSection(section.id, {
                                isActive,
                              }),
                            );
                          },
                          isActive ? "Section activated." : "Section hidden.",
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${section.title}`}
                      disabled={busy || !!draft || editing !== null}
                      onClick={() => setEditing(section.id)}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${section.title}`}
                      disabled={busy || !!draft || editing !== null}
                      onClick={() => remove(section)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                  {editing === section.id && (
                    <SectionForm
                      section={section}
                      busy={busy}
                      onSave={(fields) => save(fields, section)}
                      onCancel={() => setEditing(null)}
                    />
                  )}
                </div>
              )}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}

function SectionForm({
  section,
  busy,
  onSave,
  onCancel,
}: {
  section?: IHomepageSection;
  busy: boolean;
  onSave: (fields: SectionFields) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [type, setType] = useState<SectionType>(section?.type ?? "BANNER");
  const [configs, setConfigs] = useState<
    Partial<Record<SectionType, JsonObject>>
  >({});
  const [active, setActive] = useState(section?.isActive ?? true);
  const [uploads, setUploads] = useState<Set<string>>(() => new Set());
  const initialConfig = section?.type === type ? section.config : {};
  const config = configs[type] ?? jsonObject(initialConfig);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploads.size) return;
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title")).trim();
    if (!title) return toast.error("Enter a section title.");
    onSave({
      title,
      subtitle: String(data.get("subtitle")).trim() || null,
      type,
      config: configs[type] ?? initialConfig,
      isActive: active,
    });
  }

  return (
    <form
      method="post"
      onSubmit={submit}
      className="rounded-lg border bg-muted/35 p-3 sm:p-4"
    >
      <fieldset className="grid gap-4 sm:grid-cols-2" disabled={busy}>
        <Field id={`${id}-title`} label="Title">
          <Input
            id={`${id}-title`}
            name="title"
            defaultValue={section?.title}
            required
          />
        </Field>
        <Field id={`${id}-type`} label="Section type">
          <SelectField
            id={`${id}-type`}
            value={type}
            disabled={uploads.size > 0}
            onChange={(event) => setType(event.target.value as SectionType)}
          >
            {Object.entries(sectionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field id={`${id}-subtitle`} label="Subtitle">
          <Input
            id={`${id}-subtitle`}
            name="subtitle"
            defaultValue={section?.subtitle ?? ""}
          />
        </Field>
        <div className="self-end pb-2">
          <Toggle
            label="Active"
            checked={active}
            onChange={setActive}
            disabled={busy}
          />
        </div>
        <div className="sm:col-span-2">
          <SectionConfig
            key={type}
            type={type}
            config={config}
            uploading={uploads.size > 0}
            onChange={(patch) =>
              setConfigs((current) => {
                const prior = current[type] ?? jsonObject(initialConfig);
                const changes =
                  typeof patch === "function" ? patch(prior) : patch;
                return { ...current, [type]: { ...prior, ...changes } };
              })
            }
            onUploadStateChange={(upload, pending) =>
              setUploads((current) => {
                const next = new Set(current);
                if (pending) next.add(upload);
                else next.delete(upload);
                return next;
              })
            }
          />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={uploads.size > 0}>
            {busy ? "Saving?" : section ? "Save changes" : "Create section"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={uploads.size > 0}
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
