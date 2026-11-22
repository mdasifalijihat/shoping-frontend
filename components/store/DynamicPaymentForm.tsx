"use client";

import { Copy } from "lucide-react";
import { useId } from "react";
import { toast } from "sonner";

import type { JsonObject } from "@/app/types/api.types";
import type { IPaymentMethod } from "@/app/types/payment.types";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type PaymentDraft = Record<string, string>;

function fieldValue(values: PaymentDraft, name: string) {
  return Object.hasOwn(values, name) ? values[name] : "";
}

export function readPaymentData(
  method: IPaymentMethod,
  values: PaymentDraft,
): JsonObject {
  const entries: [string, string | number][] = [];
  for (const field of method.customFieldsSchema) {
    const value = fieldValue(values, field.name).trim();
    if (!value) {
      if (field.required) throw new Error(`Enter ${field.label}.`);
      continue;
    }
    if (field.type === "select" && !field.options?.includes(value))
      throw new Error(`Choose a valid option for ${field.label}.`);
    if (field.type === "number") {
      const number = Number(value);
      if (!Number.isFinite(number))
        throw new Error(`Enter a valid number for ${field.label}.`);
      entries.push([field.name, number]);
    } else {
      entries.push([field.name, value]);
    }
  }
  return Object.fromEntries(entries);
}

export function DynamicPaymentForm({
  method,
  values,
  onChange,
  onUpload,
  disabled,
}: {
  method: IPaymentMethod;
  values: PaymentDraft;
  onChange: (name: string, value: string) => void;
  onUpload: (name: string, pending: boolean) => void;
  disabled: boolean;
}) {
  const id = useId();

  async function copyAccount() {
    if (!method.accountNumber) return;
    try {
      await navigator.clipboard.writeText(method.accountNumber);
      toast.success("Account number copied.");
    } catch {
      toast.error("Could not copy the account number.");
    }
  }

  return (
    <div className="space-y-4 rounded-xl border bg-muted/35 p-4">
      {method.accountNumber && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Account number</p>
            <p className="break-all font-mono font-semibold">
              {method.accountNumber}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => void copyAccount()}
          >
            <Copy /> Copy
          </Button>
        </div>
      )}
      {method.instructions && (
        <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {method.instructions}
        </p>
      )}
      {method.customFieldsSchema.map((field, index) => {
        const fieldId = `${id}-${index}`;
        const value = fieldValue(values, field.name);
        const label = `${field.label}${field.required ? " *" : ""}`;
        if (field.type === "file")
          return (
            <div
              key={field.name}
              role="group"
              aria-label={field.label}
              className="grid gap-2"
            >
              <p className="text-sm font-medium">{label}</p>
              {field.placeholder && (
                <p className="text-xs text-muted-foreground">
                  {field.placeholder}
                </p>
              )}
              <ImageUploader
                value={value}
                disabled={disabled}
                onChange={(url) => onChange(field.name, url)}
                onUploadStateChange={(pending) => onUpload(field.name, pending)}
              />
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-fit"
                  disabled={disabled}
                  onClick={() => onChange(field.name, "")}
                >
                  Remove image
                </Button>
              )}
            </div>
          );
        return (
          <div key={field.name} className="grid gap-2">
            <Label htmlFor={fieldId}>{label}</Label>
            {field.type === "textarea" ? (
              <Textarea
                id={fieldId}
                disabled={disabled}
                value={value}
                required={field.required}
                placeholder={field.placeholder}
                onChange={(event) => onChange(field.name, event.target.value)}
              />
            ) : field.type === "select" ? (
              <Select
                value={value || null}
                required={field.required}
                disabled={disabled}
                onValueChange={(next) => onChange(field.name, next ?? "")}
              >
                <SelectTrigger id={fieldId} className="w-full">
                  <SelectValue
                    placeholder={field.placeholder || "Choose an option"}
                  />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {(field.options ?? []).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={fieldId}
                type={field.type}
                disabled={disabled}
                value={value}
                required={field.required}
                placeholder={field.placeholder}
                step={field.type === "number" ? "any" : undefined}
                onChange={(event) => onChange(field.name, event.target.value)}
              />
            )}
          </div>
        );
      })}
      {!method.accountNumber &&
        !method.instructions &&
        !method.customFieldsSchema.length && (
          <p className="text-sm text-muted-foreground">
            No additional payment details are required.
          </p>
        )}
    </div>
  );
}
