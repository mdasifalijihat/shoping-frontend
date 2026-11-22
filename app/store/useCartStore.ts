"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ProductAttributes } from "@/app/types/catalog.types";

export interface CartVariant {
  sku: string;
  attributes: ProductAttributes;
}

export interface CartItem {
  productId: string;
  title: string;
  slug: string;
  thumbnail: string;
  unitPrice: number;
  quantity: number;
  selectedVariant: CartVariant | null;
  maxStock: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => boolean;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => boolean;
  clearCart: () => void;
  totalItems: () => number;
  subTotal: () => number;
}

export function cartItemKey({
  productId,
  selectedVariant,
}: Pick<CartItem, "productId" | "selectedVariant">) {
  return JSON.stringify([productId, selectedVariant?.sku ?? null]);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const key = cartItemKey(item);
        const current = get().items;
        const existing = current.find((entry) => cartItemKey(entry) === key);
        const quantity = (existing?.quantity ?? 0) + item.quantity;
        if (
          !Number.isSafeInteger(item.quantity) ||
          item.quantity < 1 ||
          !Number.isSafeInteger(item.maxStock) ||
          quantity > item.maxStock
        )
          return false;
        const merged = { ...item, quantity };
        set({
          items: existing
            ? current.map((entry) =>
                cartItemKey(entry) === key ? merged : entry,
              )
            : [...current, merged],
        });
        return true;
      },
      removeItem: (key) =>
        set(({ items }) => ({
          items: items.filter((item) => cartItemKey(item) !== key),
        })),
      updateQuantity: (key, quantity) => {
        const items = get().items;
        const item = items.find((entry) => cartItemKey(entry) === key);
        if (
          !item ||
          !Number.isSafeInteger(quantity) ||
          quantity < 1 ||
          quantity > item.maxStock
        )
          return false;
        set({
          items: items.map((entry) =>
            entry === item ? { ...entry, quantity } : entry,
          ),
        });
        return true;
      },
      clearCart: () => set({ items: [] }),
      totalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
      subTotal: () =>
        get().items.reduce(
          (total, item) => total + item.unitPrice * item.quantity,
          0,
        ),
    }),
    {
      name: "storefront-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      skipHydration: true,
    },
  ),
);
