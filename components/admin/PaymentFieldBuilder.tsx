"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useId, useRef } from "react";

import type { ICustomFieldSchema } from "@/app/types/payment.types";
import { Field, SelectField, Toggle } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const types = [
  "text",
  "number",
  "tel",
  "textarea",
  "file",
  "select",
] as const satisfies readonly ICustomFieldSchema["type"][];

export interface PaymentFieldDraft {
  id: number;
  label: string;
  nameOverride?: string;
  type: ICustomFieldSchema["type"];
  placeholder: string;
  options: string;
  savedOptions?: string[];
  required: boolean;
}

function autoKey(label: string) {
  const cleaned = label
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .replace(/^[^a-z]+/i, "");
  const words = cleaned.match(/[a-z0-9]+/gi) ?? [];
  return words
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word[0].toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join("");
}

function fieldName(field: PaymentFieldDraft) {
  return field.nameOverride ?? autoKey(field.label);
}

function fieldOptions(field: PaymentFieldDraft) {
  if (field.savedOptions?.join(", ") === field.options)
    return field.savedOptions;
  return field.options
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function draftPaymentFields(
  fields: ICustomFieldSchema[],
): PaymentFieldDraft[] {
  return fields.map((field, id) => ({
    id,
    label: field.label,
    nameOverride: field.name,
    type: field.type,
    placeholder: field.placeholder ?? "",
    options: field.options?.join(", ") ?? "",
    savedOptions: field.options,
    required: field.required,
  }));
}

export function readPaymentFields(
  fields: PaymentFieldDraft[],
): ICustomFieldSchema[] {
  const used = new Set<string>();
  return fields.map((field, index) => {
    const name = fieldName(field).trim();
    const label = field.label.trim();
    if (!label || !/^[a-z][a-zA-Z0-9]*$/.test(name))
      throw new Error(
        `Checkout field ${index + 1} needs a label and a valid key starting with a lowercase letter.`,
      );
    if (used.has(name))
      throw new Error(`The checkout field key "${name}" is already used.`);
    used.add(name);
    const options = field.type === "select" ? fieldOptions(field) : undefined;
    if (
      options &&
      (!options.length || new Set(options).size !== options.length)
    ) {
      throw new Error(`Add unique options for "${label}".`);
    }
    return {
      name,
      label,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder.trim() || undefined,
      options,
    };
  });
}

export function PaymentFieldBuilder({
  fields,
  onChange,
}: {
  fields: PaymentFieldDraft[];
  onChange: (fields: PaymentFieldDraft[]) => void;
}) {
  const id = useId();
  const nextId = useRef(fields.length);
  function update(fieldId: number, patch: Partial<PaymentFieldDraft>) {
    onChange(
      fields.map((field) =>
        field.id === fieldId ? { ...field, ...patch } : field,
      ),
    );
  }
  function move(index: number, offset: number) {
    const target = index + offset;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-3">
        <h3 className="font-semibold">Checkout fields</h3>
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No checkout fields configured.
          </p>
        )}
        {fields.map((field, index) => {
          const prefix = `${id}-${field.id}`;
          return (
            <section
              key={field.id}
              aria-label={`Checkout field ${index + 1}`}
              className="space-y-3 rounded-lg border p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Field {index + 1}</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === 0}
                    aria-label={`Move field ${index + 1} up`}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === fields.length - 1}
                    aria-label={`Move field ${index + 1} down`}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove field ${index + 1}`}
                    onClick={() =>
                      onChange(fields.filter(({ id }) => id !== field.id))
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id={`${prefix}-label`} label="Label">
                  <Input
                    id={`${prefix}-label`}
                    value={field.label}
                    onChange={(e) =>
                      update(field.id, { label: e.target.value })
                    }
                  />
                </Field>
                <Field id={`${prefix}-key`} label="Field key">
                  <Input
                    id={`${prefix}-key`}
                    value={fieldName(field)}
                    onChange={(e) =>
                      update(field.id, { nameOverride: e.target.value })
                    }
                  />
                  {field.nameOverride !== undefined && (
                    <Button
                      className="w-fit"
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() =>
                        update(field.id, { nameOverride: undefined })
                      }
                    >
                      Generate from label
                    </Button>
                  )}
                </Field>
                <Field id={`${prefix}-type`} label="Type">
                  <Select
                    value={field.type}
                    onValueChange={(type) => {
                      if (type) update(field.id, { type });
                    }}
                  >
                    <SelectTrigger id={`${prefix}-type`} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {types.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field id={`${prefix}-placeholder`} label="Placeholder">
                  <Input
                    id={`${prefix}-placeholder`}
                    value={field.placeholder}
                    onChange={(e) =>
                      update(field.id, { placeholder: e.target.value })
                    }
                  />
                </Field>
                {field.type === "select" && (
                  <div className="sm:col-span-2">
                    <Field
                      id={`${prefix}-options`}
                      label="Options (comma-separated)"
                    >
                      <Input
                        id={`${prefix}-options`}
                        value={field.options}
                        onChange={(e) =>
                          update(field.id, { options: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                )}
              </div>
              <Toggle
                label="Required"
                checked={field.required}
                onChange={(required) => update(field.id, { required })}
              />
            </section>
          );
        })}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            onChange([
              ...fields,
              {
                id: nextId.current++,
                label: "",
                type: "text",
                placeholder: "",
                options: "",
                required: true,
              },
            ])
          }
        >
          <Plus /> Add Checkout Field
        </Button>
      </div>
      <aside className="space-y-3 self-start rounded-xl border bg-muted/35 p-4">
        <h3 className="font-semibold">Customer Checkout Preview</h3>
        {fields.length ? (
          <fieldset disabled className="space-y-3">
            {fields.map((field, index) => {
              const previewId = `${id}-preview-${field.id}`;
              return (
                <Field
                  key={field.id}
                  id={previewId}
                  label={`${field.label || `Field ${index + 1}`}${field.required ? " *" : ""}`}
                >
                  {field.type === "textarea" ? (
                    <Textarea id={previewId} placeholder={field.placeholder} />
                  ) : field.type === "select" ? (
                    <SelectField id={previewId}>
                      <option>{field.placeholder || "Choose an option"}</option>
                      {fieldOptions(field).map((option, index) => (
                        <option key={index}>{option}</option>
                      ))}
                    </SelectField>
                  ) : (
                    <Input
                      id={previewId}
                      type={field.type}
                      placeholder={
                        field.type === "file" ? undefined : field.placeholder
                      }
                      accept={field.type === "file" ? "image/*" : undefined}
                    />
                  )}
                </Field>
              );
            })}
          </fieldset>
        ) : (
          <p className="text-sm text-muted-foreground">
            Added fields appear here as you edit.
          </p>
        )}
      </aside>
    </div>
  );
}
