"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";

import { getPublicCategories } from "@/app/services/category.service";
import type { JsonObject } from "@/app/types/api.types";
import type { SectionType } from "@/app/types/navbar.types";
import {
  AdminError,
  Field,
  SelectField,
  flattenTree,
} from "@/components/admin/admin-ui";
import { jsonObject, textValue } from "@/components/admin/json-fields";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const sectionLabels = {
  HERO_SLIDER: "Hero slider",
  BANNER: "Banner",
  FEATURED_CATEGORIES: "Featured categories",
  PRODUCT_COLLECTION: "Product collection",
  CUSTOM_HTML: "Custom HTML",
} satisfies Record<SectionType, string>;

export { sectionLabels };

interface ConfigProps {
  config: JsonObject;
  onChange: (value: JsonObject | ((current: JsonObject) => JsonObject)) => void;
  uploading: boolean;
  onUploadStateChange: (key: string, pending: boolean) => void;
}

export function SectionConfig({
  type,
  config,
  onChange,
  uploading,
  onUploadStateChange,
}: ConfigProps & { type: SectionType }) {
  const id = useId();
  if (type === "BANNER") {
    return (
      <ImageLinkFields
        label="Banner"
        value={config}
        onChange={onChange}
        onUploadStateChange={(pending) =>
          onUploadStateChange("banner", pending)
        }
      />
    );
  }
  if (type === "HERO_SLIDER") {
    return (
      <SlidesConfig
        config={config}
        onChange={onChange}
        uploading={uploading}
        onUploadStateChange={onUploadStateChange}
      />
    );
  }
  if (type === "CUSTOM_HTML") {
    return (
      <Field id={id} label="HTML content">
        <Textarea
          id={id}
          className="min-h-40 font-mono"
          value={textValue(config.html)}
          onChange={(event) => onChange({ html: event.target.value })}
        />
      </Field>
    );
  }

  return (
    <CategoryConfig
      featured={type === "FEATURED_CATEGORIES"}
      config={config}
      onChange={onChange}
    />
  );
}

function ImageLinkFields({
  label,
  value,
  onChange,
  onUploadStateChange,
}: {
  label: string;
  value: JsonObject;
  onChange: (value: JsonObject) => void;
  onUploadStateChange: (pending: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-3">
      <div className="grid gap-2" role="group" aria-label={`${label} image`}>
        <span className="text-sm font-medium">{label} image</span>
        <ImageUploader
          value={textValue(value.imageUrl)}
          onChange={(url) => onChange({ imageUrl: url })}
          onUploadStateChange={onUploadStateChange}
        />
      </div>
      <Field id={id} label={`${label} link`}>
        <Input
          id={id}
          value={textValue(value.link)}
          placeholder="/products"
          onChange={(event) => onChange({ link: event.target.value })}
        />
      </Field>
    </div>
  );
}

function SlidesConfig({
  config,
  onChange,
  uploading,
  onUploadStateChange,
}: ConfigProps) {
  const [slideKeys, setSlideKeys] = useState(() =>
    Array.isArray(config.slides)
      ? config.slides.map((_, index) => String(index))
      : [],
  );
  const slides = Array.isArray(config.slides) ? config.slides : [];
  const nextId = useRef(slideKeys.length);

  return (
    <div className="space-y-3">
      {slides.map((value, index) => {
        const key = slideKeys[index];
        return (
          <div
            key={key}
            className="space-y-3 rounded-lg border bg-background p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Slide {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove slide ${index + 1}`}
                disabled={uploading}
                onClick={() => {
                  setSlideKeys((keys) => keys.filter((entry) => entry !== key));
                  onChange({
                    slides: slides.filter((_, position) => position !== index),
                  });
                  onUploadStateChange(key, false);
                }}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
            <ImageLinkFields
              label={`Slide ${index + 1}`}
              value={jsonObject(value)}
              onChange={(patch) =>
                onChange((current) => {
                  const currentSlides = Array.isArray(current.slides)
                    ? current.slides
                    : [];
                  return {
                    slides: currentSlides.map((slide, position) =>
                      position === index
                        ? { ...jsonObject(slide), ...patch }
                        : slide,
                    ),
                  };
                })
              }
              onUploadStateChange={(pending) =>
                onUploadStateChange(key, pending)
              }
            />
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        onClick={() => {
          const key = String(nextId.current++);
          setSlideKeys((keys) => [...keys, key]);
          onChange({ slides: [...slides, { imageUrl: "", link: "" }] });
        }}
      >
        <Plus aria-hidden="true" /> Add slide
      </Button>
    </div>
  );
}

function CategoryConfig({
  featured,
  config,
  onChange,
}: Pick<ConfigProps, "config" | "onChange"> & { featured: boolean }) {
  const id = useId();
  const categories = useQuery({
    queryKey: ["admin", "public-categories"],
    queryFn: () => getPublicCategories(),
  });
  const flat = flattenTree(categories.data ?? []);
  const selectedIds = Array.isArray(config.categoryIds)
    ? config.categoryIds.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const categoryId = textValue(config.categoryId);

  return (
    <div className="space-y-4">
      {categories.error && (
        <AdminError
          error={categories.error}
          retry={() => void categories.refetch()}
        />
      )}
      <Field id={`${id}-category`} label={featured ? "Categories" : "Category"}>
        {featured ? (
          <SelectField
            id={`${id}-category`}
            multiple
            size={Math.max(3, Math.min(flat.length + 1, 6))}
            className="h-auto py-1"
            value={selectedIds}
            onChange={(event) =>
              onChange({
                categoryIds: Array.from(
                  event.currentTarget.selectedOptions,
                  (option) => option.value,
                ),
              })
            }
          >
            {flat.map(({ item, depth }) => (
              <option key={item.id} value={item.id}>
                {`? `.repeat(depth)}
                {item.name}
              </option>
            ))}
            {selectedIds
              .filter(
                (selected) => !flat.some(({ item }) => item.id === selected),
              )
              .map((selected) => (
                <option key={selected} value={selected}>
                  {selected}
                </option>
              ))}
          </SelectField>
        ) : (
          <SelectField
            id={`${id}-category`}
            value={categoryId}
            onChange={(event) =>
              onChange({ categoryId: event.target.value || null })
            }
          >
            <option value="">
              {categories.isPending ? "Loading categories?" : "All categories"}
            </option>
            {flat.map(({ item, depth }) => (
              <option key={item.id} value={item.id}>
                {`? `.repeat(depth)}
                {item.name}
              </option>
            ))}
            {categoryId && !flat.some(({ item }) => item.id === categoryId) && (
              <option value={categoryId}>{categoryId}</option>
            )}
          </SelectField>
        )}
      </Field>
      {featured && (
        <p className="text-xs text-muted-foreground">
          Leave the selection empty to use the store?s featured categories.
        </p>
      )}
      <Field
        id={`${id}-limit`}
        label={featured ? "Category limit" : "Product limit"}
      >
        <Input
          id={`${id}-limit`}
          type="number"
          min={1}
          max={100}
          value={typeof config.limit === "number" ? config.limit : ""}
          placeholder={featured ? "6" : "8"}
          onChange={(event) =>
            onChange({
              limit: event.target.value ? Number(event.target.value) : null,
            })
          }
        />
      </Field>
    </div>
  );
}
