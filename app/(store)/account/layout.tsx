"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ClipboardList, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { customerQueryKey } from "@/components/store/customer-query";
import { StoreLoading } from "@/components/store/store-ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { confirmSignOut } from "@/lib/confirm-sign-out";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", name: "My Profile", Icon: UserRound },
  { href: "/account/orders", name: "My Orders", Icon: ClipboardList },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const session = authClient.useSession();
  const user = session.data?.user;
  const canViewAccount =
    !session.isPending && Boolean(user && !user.isBlocked);
  const [pending, setPending] = useState(false);
  const cache = useQueryClient();
  const router = useRouter();

  async function logout() {
    if (pending) return;
    setPending(true);
    try {
      if (!(await confirmSignOut())) return;

      const { error } = await authClient.signOut();
      if (error) {
        toast.error(error.message || "Could not sign out.");
        return;
      }
      cache.removeQueries({ queryKey: customerQueryKey });
      toast.success("Signed out.");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        My account
      </h1>
      {session.isPending ? (
        <StoreLoading rows={2} />
      ) : !canViewAccount ? (
        <div className="space-y-3 rounded-xl border bg-card p-5">
          <p>Log in to view your account.</p>
          <Link href="/login" className={buttonVariants()}>
            Log in
          </Link>
        </div>
      ) : null}
      <div
        className={
          canViewAccount
            ? "grid items-start gap-5 lg:grid-cols-[13rem_minmax(0,1fr)]"
            : "hidden"
        }
      >
        {canViewAccount && (
          <Card className="gap-2 p-2">
            <Suspense fallback={<Skeleton className="h-9" />}>
              <AccountLinks />
            </Suspense>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              className="justify-start text-muted-foreground"
              onClick={() => void logout()}
            >
              <LogOut /> {pending ? "Signing out..." : "Logout"}
            </Button>
          </Card>
        )}
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}

function AccountLinks() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Account navigation"
      className="flex flex-wrap gap-1 lg:flex-col"
    >
      {links.map(({ href, name, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-muted",
              active &&
                "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
            )}
          >
            <Icon className="size-4" />
            {name}
          </Link>
        );
      })}
    </nav>
  );
}
