import type { JsonObject, JsonValue } from "@/app/types/api.types";

export function jsonObject(value: JsonValue | undefined): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

export function textValue(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "";
}
