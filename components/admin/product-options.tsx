"use client";

import { Plus, Trash2, WandSparkles } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import type {
  IAttribute,
  IProductVariant,
  ProductAttributes,
} from "@/app/types/catalog.types";
import { Field } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface SpecDraft {
  key: string;
  value: string | number | boolean;
}

export interface VariantDraft {
  id: number;
  sku: string;
  price: string;
  stock: string;
  specs: SpecDraft[];
}

export function toSpecs(values: ProductAttributes): SpecDraft[] {
  return Object.entries(values).map(([key, value]) => ({ key, value }));
}

export function readSpecs(
  drafts: SpecDraft[],
  label: string,
): ProductAttributes {
  const entries = drafts.map(({ key, value }) => [key.trim(), value] as const);
  if (entries.some(([key]) => !key)) {
    throw new Error(
      `Enter a key for each row in ${label} or remove the empty row.`,
    );
  }
  if (new Set(entries.map(([key]) => key)).size !== entries.length) {
    throw new Error(`Use unique keys in ${label}.`);
  }
  return Object.fromEntries(entries);
}

export function toVariantDrafts(variants: IProductVariant[]): VariantDraft[] {
  return variants.map(({ sku, attributes, price, stock }, id) => ({
    id,
    sku,
    specs: toSpecs(attributes),
    price: String(price),
    stock: String(stock),
  }));
}

export function readStock(value: string, label: string): number {
  const stock = Number(value);
  if (
    !value.trim() ||
    !Number.isInteger(stock) ||
    stock < 0 ||
    stock > 2_147_483_647
  ) {
    throw new Error(
      `${label} must be a whole number between 0 and 2,147,483,647.`,
    );
  }
  return stock;
}

export function readPrice(value: string, label: string): number {
  const price = Number(value);
  if (!value.trim() || !Number.isFinite(price) || price < 0)
    throw new Error(`${label} must be zero or more.`);
  return price;
}

export function readVariants(drafts: VariantDraft[]): IProductVariant[] {
  const used = new Set<string>();
  return drafts.map((draft, index) => {
    const label = `variant ${index + 1}`;
    const sku = draft.sku.trim();
    if (!sku) throw new Error(`Enter an SKU for ${label}.`);
    if (used.has(sku)) throw new Error("Variant SKUs must be unique.");
    used.add(sku);
    return {
      sku,
      attributes: readSpecs(draft.specs, label),
      price: readPrice(draft.price, `Price for ${label}`),
      stock: readStock(draft.stock, `Stock for ${label}`),
    };
  });
}

export function SpecFields({
  specs,
  onChange,
  addLabel,
  prefix,
}: {
  specs: SpecDraft[];
  onChange: (value: SpecDraft[]) => void;
  addLabel: string;
  prefix: string;
}) {
  const id = useId();
  function change(index: number, patch: Partial<SpecDraft>) {
    onChange(
      specs.map((entry, position) =>
        position === index ? { ...entry, ...patch } : entry,
      ),
    );
  }
  return (
    <div className="space-y-3">
      {specs.map(({ key, value }, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
        >
          <div className="col-span-2 sm:col-span-1">
            <Field id={`${id}-key-${index}`} label="Key">
              <Input
                id={`${id}-key-${index}`}
                value={key}
                placeholder={prefix === "Specification" ? "Fabric" : "Color"}
                onChange={(event) => change(index, { key: event.target.value })}
              />
            </Field>
          </div>
          <Field id={`${id}-value-${index}`} label="Value">
            <Input
              id={`${id}-value-${index}`}
              value={String(value)}
              onChange={(event) => change(index, { value: event.target.value })}
            />
          </Field>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove ${prefix.toLowerCase()} ${index + 1}`}
            onClick={() =>
              onChange(specs.filter((_, position) => position !== index))
            }
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...specs, { key: "", value: "" }])}
      >
        <Plus /> {addLabel}
      </Button>
    </div>
  );
}

function combinationKey(specs: SpecDraft[]) {
  return JSON.stringify(
    specs
      .map(({ key, value }) => [key.trim(), value] as const)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)),
  );
}

const generationLimit = 500;

export function VariantEditor({
  templates,
  drafts,
  onChange,
  getDefaults,
}: {
  templates: IAttribute[];
  drafts: VariantDraft[];
  onChange: (drafts: VariantDraft[]) => void;
  getDefaults: () => { sku: string; price: string };
}) {
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const nextId = useRef(drafts.length);
  const id = useId();
  const choices = templates.flatMap(({ id, name, values }) => {
    const selected = values.filter((value) => selections[id]?.includes(value));
    return selected.length ? [{ key: name, selected }] : [];
  });
  const combinations = choices.reduce(
    (total, { selected }) => total * selected.length,
    choices.length ? 1 : 0,
  );

  function generate() {
    if (!combinations || combinations > generationLimit) return;
    const defaults = getDefaults();
    const existing = new Set(drafts.map(({ specs }) => combinationKey(specs)));
    const skus = new Set(drafts.map(({ sku }) => sku.trim()));
    const options = choices.reduce<SpecDraft[][]>(
      (groups, { key, selected }) =>
        groups.flatMap((group) =>
          selected.map((value) => [...group, { key, value }]),
        ),
      [[]],
    );
    const added: VariantDraft[] = [];
    for (const specs of options) {
      const signature = combinationKey(specs);
      if (existing.has(signature)) continue;
      existing.add(signature);
      const rawSku = [
        defaults.sku || "VAR",
        ...specs.map(({ value }) => String(value)),
      ]
        .join("-")
        .toUpperCase()
        .replace(/[^A-Z0-9_-]+/g, "-")
        .replace(/-+$/g, "");
      const base = rawSku || "VAR";
      let sku = base;
      for (let suffix = 2; skus.has(sku); suffix++) sku = `${base}-${suffix}`;
      skus.add(sku);
      added.push({
        id: nextId.current++,
        specs,
        sku,
        price: defaults.price,
        stock: "0",
      });
    }
    if (!added.length)
      return toast.info("All selected combinations are already present.");
    onChange([...drafts, ...added]);
    toast.success(
      `Added ${added.length} ${added.length === 1 ? "variant" : "variants"} to the form.`,
    );
  }

  function change(id: number, patch: Partial<VariantDraft>) {
    onChange(
      drafts.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  }

  return (
    <div className="space-y-4">
      {templates.length > 0 && (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-3 sm:p-4">
          {templates.map(
            (template) =>
              template.values.length > 0 && (
                <fieldset key={template.id} className="min-w-0 space-y-2">
                  <legend className="text-sm font-semibold">
                    {template.name}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {template.values.map((value) => {
                      const selected =
                        selections[template.id]?.includes(value) ?? false;
                      return (
                        <Button
                          key={value}
                          type="button"
                          size="sm"
                          variant={selected ? "default" : "outline"}
                          aria-pressed={selected}
                          onClick={() =>
                            setSelections((current) => {
                              const values = current[template.id] ?? [];
                              return {
                                ...current,
                                [template.id]: selected
                                  ? values.filter((entry) => entry !== value)
                                  : [...values, value],
                              };
                            })
                          }
                        >
                          {value}
                        </Button>
                      );
                    })}
                  </div>
                </fieldset>
              ),
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!combinations || combinations > generationLimit}
              onClick={generate}
            >
              <WandSparkles /> Generate Variants
            </Button>
            {combinations > 0 && (
              <span className="text-xs text-muted-foreground">
                {combinations.toLocaleString()} combinations
                {combinations > generationLimit
                  ? ` - Select up to ${generationLimit} at a time`
                  : ""}
              </span>
            )}
          </div>
        </div>
      )}
      {drafts.map((draft, index) => (
        <section
          key={draft.id}
          aria-labelledby={`${id}-variant-${draft.id}`}
          className="space-y-3 rounded-lg border p-3 sm:p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id={`${id}-variant-${draft.id}`}
                className="text-sm font-semibold"
              >
                Variant {index + 1}
              </h3>
              {draft.specs.some(({ value }) => String(value)) && (
                <Badge variant="secondary" className="h-auto whitespace-normal">
                  {draft.specs
                    .map(({ value }) => String(value))
                    .filter(Boolean)
                    .join(" / ")}
                </Badge>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove variant ${index + 1}`}
              onClick={() =>
                onChange(drafts.filter(({ id }) => id !== draft.id))
              }
            >
              <Trash2 />
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field id={`${id}-sku-${draft.id}`} label="Variant SKU">
              <Input
                id={`${id}-sku-${draft.id}`}
                required
                value={draft.sku}
                onChange={(event) =>
                  change(draft.id, { sku: event.target.value })
                }
              />
            </Field>
            <Field id={`${id}-price-${draft.id}`} label="Variant price">
              <Input
                id={`${id}-price-${draft.id}`}
                type="number"
                min="0"
                step="any"
                required
                value={draft.price}
                onChange={(event) =>
                  change(draft.id, { price: event.target.value })
                }
              />
            </Field>
            <Field id={`${id}-stock-${draft.id}`} label="Variant stock">
              <Input
                id={`${id}-stock-${draft.id}`}
                type="number"
                min="0"
                step="1"
                required
                value={draft.stock}
                onChange={(event) =>
                  change(draft.id, { stock: event.target.value })
                }
              />
            </Field>
          </div>
          <details className="space-y-3">
            <summary className="cursor-pointer text-sm font-medium">
              Variant attributes
            </summary>
            <SpecFields
              specs={draft.specs}
              onChange={(specs) => change(draft.id, { specs })}
              addLabel="Add attribute pair"
              prefix="Variant attribute"
            />
          </details>
        </section>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const { price } = getDefaults();
          onChange([
            ...drafts,
            { id: nextId.current++, sku: "", price, stock: "0", specs: [] },
          ]);
        }}
      >
        <Plus /> Add variant
      </Button>
    </div>
  );
}
