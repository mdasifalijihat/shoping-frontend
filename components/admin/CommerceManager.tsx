"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  AdminError,
  AdminHeading,
  AdminLoading,
  Toggle,
  useAdminAction,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Entity = { id: string; isActive: boolean };
export type CommerceFormProps<T, Input> = {
  item?: T;
  busy: boolean;
  save: (input: () => Input) => void;
  cancel: () => void;
  setUploading: (pending: boolean) => void;
};

export function CommerceManager<T extends Entity, Input>({
  title,
  description,
  singular,
  queryKey,
  list,
  create,
  update,
  remove,
  name,
  columns,
  renderForm,
  wide,
}: {
  title: string;
  description: string;
  singular: string;
  queryKey: readonly string[];
  list: () => Promise<T[]>;
  create: (data: Input, items: T[]) => Promise<T>;
  update: (id: string, data: Input | { isActive: boolean }) => Promise<T>;
  remove: (id: string) => Promise<void>;
  name: (item: T) => string;
  columns: { label: string; render: (item: T) => ReactNode }[];
  renderForm: (props: CommerceFormProps<T, Input>) => ReactNode;
  wide?: boolean;
}) {
  const query = useQuery({ queryKey, queryFn: list });
  const cache = useQueryClient();
  const { busy, run } = useAdminAction();
  const [editor, setEditor] = useState<{ item?: T } | null>(null);
  const [uploading, setUploading] = useState(false);

  function save(input: () => Input) {
    if (uploading) return;
    const current = editor?.item;
    void run(
      async () => {
        const data = input();
        if (current) await update(current.id, data);
        else await create(data, query.data ?? []);
        setEditor(null);
        await cache.invalidateQueries({ queryKey });
      },
      current ? "Changes saved." : `${capitalize(singular)} created.`,
    );
  }

  function toggle(item: T, isActive: boolean) {
    void run(
      async () => {
        await update(item.id, { isActive });
        await cache.invalidateQueries({ queryKey });
      },
      isActive ? "Activated." : "Deactivated.",
    );
  }

  function deleteItem(item: T) {
    if (!window.confirm(`Delete ${singular} "${name(item)}"?`)) return;
    void run(
      async () => {
        await remove(item.id);
        await cache.invalidateQueries({ queryKey });
      },
      `${capitalize(singular)} deleted.`,
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-4">
        <AdminHeading title={title} description={description} />
        <Button
          type="button"
          className="mb-4"
          disabled={busy || !query.data}
          onClick={() => setEditor({})}
        >
          <Plus /> Add {singular}
        </Button>
      </div>
      {query.isPending && <AdminLoading />}
      {query.error && (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      )}
      {query.data && (
        <Card>
          <CardContent>
            {query.data.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map(({ label }) => (
                      <TableHead key={label}>{label}</TableHead>
                    ))}
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.map((item) => (
                    <TableRow key={item.id}>
                      {columns.map(({ label, render }) => (
                        <TableCell key={label}>{render(item)}</TableCell>
                      ))}
                      <TableCell>
                        <Toggle
                          label={`Activate ${name(item)}`}
                          hideLabel
                          checked={item.isActive}
                          disabled={busy}
                          onChange={(value) => toggle(item, value)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={busy}
                            aria-label={`Edit ${name(item)}`}
                            onClick={() => setEditor({ item })}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={busy}
                            aria-label={`Delete ${name(item)}`}
                            onClick={() => deleteItem(item)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">
                No entries yet.
              </p>
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
        <DialogContent
          className={`max-h-[90dvh] overflow-y-auto ${wide ? "sm:max-w-5xl" : "sm:max-w-xl"}`}
        >
          <DialogHeader>
            <DialogTitle>
              {editor?.item ? "Edit" : "Add"} {singular}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {editor &&
            renderForm({
              item: editor.item,
              busy,
              save,
              cancel: () => setEditor(null),
              setUploading,
            })}
        </DialogContent>
      </Dialog>
    </>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function CommerceFormButtons({
  busy,
  uploading,
  editing,
  cancel,
}: {
  busy: boolean;
  uploading?: boolean;
  editing: boolean;
  cancel: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-t pt-4">
      <Button type="submit" disabled={busy || uploading}>
        {busy ? "Saving..." : editing ? "Save changes" : "Create"}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={busy || uploading}
        onClick={cancel}
      >
        Cancel
      </Button>
    </div>
  );
}

export function formText(data: FormData, key: string) {
  return String(data.get(key) ?? "").trim();
}

export function optionalAmount(data: FormData, key: string) {
  const value = formText(data, key);
  return value === "" ? null : Number(value);
}
