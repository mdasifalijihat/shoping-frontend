"use client";

import {
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function AdminHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6 space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </header>
  );
}

export function AdminLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="grid gap-4 sm:grid-cols-2"
    >
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-64 rounded-xl sm:col-span-2" />
    </div>
  );
}

export function AdminError({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
    >
      <p className="text-sm text-destructive">{error.message}</p>
      <Button type="button" variant="outline" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

export function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export function SelectField({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Toggle({
  label,
  checked,
  hideLabel,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  hideLabel?: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
      <Label htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </Label>
    </div>
  );
}

export function useAdminAction() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void | string>, success: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const message = await action();
      toast.success(message || success);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The action could not be completed.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return { busy, run };
}

export function flattenTree<T extends { children?: T[] }>(
  items: T[],
  depth = 0,
): { item: T; depth: number }[] {
  return items.flatMap((item) => [
    { item, depth },
    ...flattenTree(item.children ?? [], depth + 1),
  ]);
}
