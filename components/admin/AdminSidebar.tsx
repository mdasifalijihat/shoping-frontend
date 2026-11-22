"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Boxes,
  CreditCard,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  ListTree,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Tags,
  Ticket,
  Truck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const groups = [
  [{ path: "", label: "Dashboard", icon: LayoutDashboard }],
  [
    { path: "/navbar", label: "Navbar Builder", icon: ListTree },
    { path: "/homepage", label: "Homepage Builder", icon: LayoutTemplate },
    { path: "/pages", label: "Custom Pages", icon: FileText },
    { path: "/settings", label: "Site Settings", icon: Settings },
  ],
  [
    { path: "/categories", label: "Categories", icon: Boxes },
    { path: "/attributes", label: "Attributes", icon: Tags },
    { path: "/products", label: "Products", icon: Package },
    { path: "/payment-methods", label: "Payment Methods", icon: CreditCard },
    { path: "/shipping-zones", label: "Shipping Zones", icon: Truck },
    { path: "/coupons", label: "Coupons", icon: Ticket },
    { path: "/orders", label: "Orders", icon: ShoppingBag },
    { path: "/users", label: "Users", icon: Users },
  ],
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="space-y-2 p-3">
      {groups.map((group, index) => (
        <div key={group[0].label} className="space-y-1">
          {index > 0 && <Separator className="my-2" />}
          {group.map(({ path, icon: Icon, label }) => {
            const href = `/admin${path}`;
            const active =
              pathname === href ||
              (path !== "" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { data, isPending } = authClient.useSession();
  const router = useRouter();

  async function signOut() {
    setSigningOut(true);
    try {
      const { error } = await authClient.signOut();
      if (error) {
        toast.error(error.message || "Could not sign out.");
        return;
      }
      queryClient.clear();
      toast.success("Signed out.");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="grid min-h-dvh flex-1 bg-muted/35 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block">
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5 font-semibold">
            <ShieldCheck className="size-5" aria-hidden="true" />
            Store Admin
          </div>
          <Suspense fallback={<Skeleton className="m-3 h-60" />}>
            <AdminSidebar />
          </Suspense>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-2 backdrop-blur sm:px-6">
            <div className="lg:hidden">
              <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetTrigger
                  render={
                    <Button type="button" variant="outline" size="icon" />
                  }
                  aria-label="Open admin navigation"
                >
                  <Menu aria-hidden="true" />
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="gap-0 overflow-y-auto bg-sidebar"
                >
                  <SheetHeader>
                    <SheetTitle>Store Admin</SheetTitle>
                  </SheetHeader>
                  <Separator />
                  <Suspense fallback={<Skeleton className="m-3 h-60" />}>
                    <AdminSidebar onNavigate={() => setDrawerOpen(false)} />
                  </Suspense>
                </SheetContent>
              </Sheet>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-medium hover:underline sm:text-sm"
            >
              View Live Store{" "}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
            <div className="ml-auto flex items-center gap-3">
              {isPending && <Skeleton className="h-8 w-16 sm:w-24" />}
              {data?.user && (
                <div className="min-w-0 text-right text-xs">
                  <div className="max-w-25 truncate font-semibold sm:max-w-48">
                    {data.user.name}
                  </div>
                  <div className="text-muted-foreground">
                    {data.user.role?.replaceAll("_", " ")}
                  </div>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={signOut}
                disabled={signingOut}
              >
                <LogOut aria-hidden="true" /> Logout
              </Button>
            </div>
          </header>
          <main className="mx-auto w-full max-w-[92rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
