"use client";

import { useMemo, useState } from "react";

import type {
  IProductVariant,
  ProductAttributes,
} from "@/app/types/catalog.types";
import { Button } from "@/components/ui/button";

type Value = ProductAttributes[string] | undefined;

function valueFor(variant: IProductVariant, key: string): Value {
  return Object.hasOwn(variant.attributes, key)
    ? variant.attributes[key]
    : undefined;
}

function matches(variant: IProductVariant, selected: Map<string, Value>) {
  return [...selected].every(([key, value]) =>
    Object.is(valueFor(variant, key), value),
  );
}

function attributeLabel(value: Value) {
  if (value === undefined) return "Not specified";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function VariantSelector({
  variants,
  onChange,
}: {
  variants: IProductVariant[];
  onChange: (variant: IProductVariant | undefined) => void;
}) {
  const groups = useMemo(
    () =>
      [
        ...new Set(
          variants.flatMap(({ attributes }) => Object.keys(attributes)),
        ),
      ].map((key) => ({
        key,
        values: [
          ...new Set(
            variants.map((variant) =>
              Object.hasOwn(variant.attributes, key)
                ? variant.attributes[key]
                : undefined,
            ),
          ),
        ],
      })),
    [variants],
  );
  const [selected, setSelected] = useState(() => new Map<string, Value>());
  const [sku, setSku] = useState("");
  const complete = groups.every(({ key }) => selected.has(key));
  const candidates = complete
    ? variants.filter((variant) => matches(variant, selected))
    : [];
  const sellable = candidates.filter((variant) => variant.stock > 0);
  const showSkus = complete && candidates.length > 1 && sellable.length > 1;

  function select(key: string, value: Value) {
    const next = new Map<string, Value>([[key, value]]);
    for (const [other, option] of selected) {
      if (other === key) continue;
      const expanded = new Map(next).set(other, option);
      if (
        variants.some(
          (variant) => variant.stock > 0 && matches(variant, expanded),
        )
      )
        next.set(other, option);
    }
    const found = groups.every((group) => next.has(group.key))
      ? variants.filter(
          (variant) => variant.stock > 0 && matches(variant, next),
        )
      : [];
    setSelected(next);
    setSku("");
    onChange(found.length === 1 ? found[0] : undefined);
  }

  return (
    <div className="space-y-4">
      {groups.map(({ key, values }) => (
        <fieldset key={key} className="space-y-2">
          <legend className="text-sm font-semibold">{key}</legend>
          <div className="flex flex-wrap gap-2">
            {values.map((value) => {
              const active =
                selected.has(key) && Object.is(selected.get(key), value);
              const direct = new Map(selected).set(key, value);
              const matching = variants.filter((variant) =>
                matches(variant, direct),
              );
              const available = matching.length
                ? matching.some((variant) => variant.stock > 0)
                : variants.some(
                    (variant) =>
                      variant.stock > 0 &&
                      Object.is(valueFor(variant, key), value),
                  );
              return (
                <Button
                  key={JSON.stringify([typeof value, value])}
                  type="button"
                  variant={active ? "default" : "outline"}
                  aria-pressed={active}
                  disabled={!available}
                  onClick={() => select(key, value)}
                >
                  {attributeLabel(value)}
                  {!available && (
                    <span className="sr-only"> (out of stock)</span>
                  )}
                </Button>
              );
            })}
          </div>
        </fieldset>
      ))}
      {(showSkus || (!groups.length && candidates.length > 1)) && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Variant SKU</legend>
          <div className="flex flex-wrap gap-2">
            {candidates.map((variant) => (
              <Button
                key={variant.sku}
                type="button"
                variant={sku === variant.sku ? "default" : "outline"}
                aria-pressed={sku === variant.sku}
                disabled={variant.stock <= 0}
                onClick={() => {
                  setSku(variant.sku);
                  onChange(variant);
                }}
              >
                {variant.sku}
              </Button>
            ))}
          </div>
        </fieldset>
      )}
      {selected.size > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => {
            setSelected(new Map());
            setSku("");
            onChange(undefined);
          }}
        >
          Clear selection
        </Button>
      )}
    </div>
  );
}
