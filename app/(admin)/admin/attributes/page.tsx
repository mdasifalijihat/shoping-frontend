"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  createAttribute,
  deleteAttribute,
  updateAttribute,
  type AttributeInput,
} from "@/app/services/product.service";
import type { IAttribute } from "@/app/types/catalog.types";
import {
  AdminError,
  AdminHeading,
  AdminLoading,
  Field,
  useAdminAction,
} from "@/components/admin/admin-ui";
import { attributesQuery } from "@/components/admin/catalog-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function AttributesPage() {
  const query = useQuery(attributesQuery);
  const cache = useQueryClient();
  const { busy, run } = useAdminAction();
  const [editor, setEditor] = useState<{ attribute?: IAttribute } | null>(null);

  function save(data: AttributeInput) {
    const item = editor?.attribute;
    void run(
      async () => {
        if (item) await updateAttribute(item.id, data);
        else await createAttribute(data);
        setEditor(null);
        await cache.invalidateQueries({ queryKey: attributesQuery.queryKey });
      },
      item ? "Attribute updated." : "Attribute created.",
    );
  }

  function remove(item: IAttribute) {
    if (!window.confirm(`Delete the "${item.name}" attribute template?`))
      return;
    void run(async () => {
      await deleteAttribute(item.id);
      await cache.invalidateQueries({ queryKey: attributesQuery.queryKey });
    }, "Attribute deleted.");
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-4">
        <AdminHeading
          title="Attributes"
          description="Manage reusable options for product variants."
        />
        <Button
          type="button"
          disabled={busy || !query.data}
          onClick={() => setEditor({})}
        >
          <Plus /> Add attribute
        </Button>
      </div>
      {query.isPending && <AdminLoading />}
      {query.error && (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      )}
      {query.data &&
        (query.data.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {query.data.map((item) => (
              <Card key={item.id}>
                <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="break-all">{item.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={busy}
                      onClick={() => setEditor({ attribute: item })}
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={busy}
                      onClick={() => remove(item)}
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {item.values.length ? (
                    item.values.map((value) => (
                      <Badge key={value} variant="secondary">
                        {value}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No values.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-sm text-muted-foreground">
              No attributes yet.
            </CardContent>
          </Card>
        ))}
      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setEditor(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editor?.attribute ? "Edit attribute" : "Add attribute"}
            </DialogTitle>
            <DialogDescription>
              Type each value and press Enter to add it.
            </DialogDescription>
          </DialogHeader>
          {editor && (
            <AttributeForm
              item={editor.attribute}
              busy={busy}
              onSave={save}
              onCancel={() => setEditor(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AttributeForm({
  item,
  busy,
  onSave,
  onCancel,
}: {
  item?: IAttribute;
  busy: boolean;
  onSave: (value: AttributeInput) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(item?.values ?? []);
  const [entry, setEntry] = useState("");

  function add() {
    const value = entry.trim();
    if (!value) return;
    if (values.includes(value))
      return toast.error("That value already exists.");
    setValues([...values, value]);
    setEntry("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(
      new FormData(event.currentTarget).get("name") ?? "",
    ).trim();
    if (!name) return toast.error("Enter an attribute name.");
    const pending = entry.trim();
    if (pending && values.includes(pending))
      return toast.error("That value already exists.");
    onSave({ name, values: pending ? [...values, pending] : values });
  }

  return (
    <form method="post" onSubmit={submit}>
      <fieldset disabled={busy} className="grid gap-4">
        <Field id="attribute-name" label="Name">
          <Input
            id="attribute-name"
            name="name"
            required
            defaultValue={item?.name}
            placeholder="Size"
          />
        </Field>
        <Field id="attribute-value" label="Values">
          <div className="flex gap-2">
            <Input
              id="attribute-value"
              value={entry}
              onChange={(event) => setEntry(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  add();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={add}>
              Add value
            </Button>
          </div>
        </Field>
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="h-auto gap-1 py-1"
            >
              {value}
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted focus-visible:outline"
                aria-label={`Remove ${value}`}
                onClick={() =>
                  setValues(values.filter((entry) => entry !== value))
                }
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="submit">
            {busy ? "Saving..." : item ? "Save changes" : "Create attribute"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
