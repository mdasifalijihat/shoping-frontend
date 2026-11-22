"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useCartStore } from "@/app/store/useCartStore";

const CartReady = createContext(false);

export function useCartReady() {
  return useContext(CartReady);
}

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      try {
        await useCartStore.persist?.rehydrate();
      } catch {
        // The cart still works in memory when storage is unavailable.
      } finally {
        if (active) setReady(true);
      }
    }
    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  return (
    <QueryClientProvider client={client}>
      <CartReady.Provider value={ready}>{children}</CartReady.Provider>
    </QueryClientProvider>
  );
}
