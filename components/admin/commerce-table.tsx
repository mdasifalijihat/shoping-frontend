"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";

import type { IMeta } from "@/app/types/api.types";
import { Field } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminSearch({
  id,
  label,
  placeholder,
  onSearch,
}: {
  id: string;
  label: string;
  placeholder: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(value.trim());
      }}
    >
      <Field id={id} label={label}>
        <div className="flex gap-2">
          <Input
            id={id}
            type="search"
            value={value}
            placeholder={placeholder}
            onChange={(event) => setValue(event.target.value)}
          />
          <Button type="submit" variant="outline">
            <Search /> Search
          </Button>
        </div>
      </Field>
    </form>
  );
}

export function AdminPagination({
  meta,
  onPage,
  label,
}: {
  meta: IMeta;
  onPage: (page: number) => void;
  label: string;
}) {
  const last = Math.max(meta.totalPage, 1);
  return (
    <nav
      aria-label={`${label} pages`}
      className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm"
    >
      <span className="text-muted-foreground">
        {meta.total} {label}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={meta.page <= 1}
          onClick={() => onPage(meta.page - 1)}
        >
          <ChevronLeft />
        </Button>
        <span>
          Page {meta.page} of {last}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={meta.page >= last}
          onClick={() => onPage(meta.page + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
