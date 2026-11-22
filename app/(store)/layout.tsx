import type { ReactNode } from "react";

import { DynamicFooter } from "@/components/store/DynamicFooter";
import { DynamicNavbar } from "@/components/store/DynamicNavbar";
import { StorefrontProvider } from "@/components/store/StorefrontProvider";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <StorefrontProvider>
      <DynamicNavbar />
      <div className="flex flex-1 flex-col">{children}</div>
      <DynamicFooter />
    </StorefrontProvider>
  );
}
