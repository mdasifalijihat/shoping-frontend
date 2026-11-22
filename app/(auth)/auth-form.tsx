"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const register = mode === "register";
  const title = register ? "Create an account" : "Sign in";
  const fallback = register ? "Could not create your account." : "Could not sign in.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    const name = String(form.get("name") ?? "").trim();
    if (register && !name) {
      toast.error("Enter your name.");
      return;
    }

    setPending(true);
    try {
      if (register) {
        const { data, error } = await authClient.signUp.email({ name, email, password });
        if (error) {
          toast.error(error.message || fallback);
          return;
        }

        toast.success("Account created.");
        router.replace(data.token ? "/" : "/login");
      } else {
        const { data, error } = await authClient.signIn.email({ email, password });
        if (error) {
          toast.error(error.message || fallback);
          return;
        }
        if (data.user.isBlocked) {
          await authClient.signOut();
          toast.error("This account is blocked.");
          return;
        }

        const { role } = data.user;
        toast.success("Signed in.");
        router.replace(role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin" : "/");
      }
    } catch {
      toast.error(fallback);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="gap-6 p-6 shadow-sm sm:p-8">
      <CardHeader className="px-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </CardHeader>
      <CardContent className="px-0">
        <form method="post" onSubmit={handleSubmit} className="space-y-5" aria-busy={pending}>
          {register && (
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" autoComplete="name" required className="h-10" />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required className="h-10" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              minLength={register ? 8 : undefined}
              required
              className="h-10"
            />
          </div>
          <Button type="submit" disabled={pending} className="h-10 w-full">
            {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {title}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {register ? "Already have an account?" : "New here?"}{" "}
          <Link
            href={register ? "/login" : "/register"}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
