"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  getAllUsers,
  toggleUserBlockStatus,
  updateUserRole,
  type AdminUser,
  type AdminUserParams,
} from "@/app/services/admin.service";
import {
  AdminError,
  AdminHeading,
  AdminLoading,
  Toggle,
  useAdminAction,
} from "@/components/admin/admin-ui";
import {
  AdminPagination,
  AdminSearch,
} from "@/components/admin/commerce-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";

const roles = [
  "SUPER_ADMIN",
  "ADMIN",
  "CUSTOMER",
] as const satisfies readonly AdminUser["role"][];

export default function UsersPage() {
  const [filters, setFilters] = useState<AdminUserParams>({
    page: 1,
    limit: 20,
  });
  const query = useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => getAllUsers(filters),
  });
  const session = authClient.useSession();
  const actor = session.data?.user;
  const cache = useQueryClient();
  const { busy, run } = useAdminAction();

  function changeRole(user: AdminUser, role: AdminUser["role"]) {
    if (
      actor?.role !== "SUPER_ADMIN" ||
      actor.id === user.id ||
      role === user.role
    )
      return;
    if (
      !window.confirm(
        `Change ${user.name}'s role to ${role.replaceAll("_", " ")}?`,
      )
    )
      return;
    void run(async () => {
      await updateUserRole(user.id, role);
      await Promise.all([
        cache.invalidateQueries({ queryKey: ["admin", "users"] }),
        cache.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
      ]);
    }, "User role updated.");
  }

  function changeBlocked(user: AdminUser) {
    if (
      (actor?.role !== "ADMIN" && actor?.role !== "SUPER_ADMIN") ||
      user.role !== "CUSTOMER" ||
      actor.id === user.id
    )
      return;
    if (!user.isBlocked && !window.confirm(`Block ${user.name}?`)) return;
    void run(async () => {
      const updated = await toggleUserBlockStatus(user.id, !user.isBlocked);
      await cache.invalidateQueries({ queryKey: ["admin", "users"] });
      return updated.isBlocked ? "Customer blocked." : "Customer unblocked.";
    }, "Customer status updated.");
  }

  return (
    <>
      <AdminHeading
        title="Users"
        description="Find user accounts and manage store access."
      />
      <Card className="mb-4">
        <CardContent className="max-w-lg">
          <AdminSearch
            id="users-search"
            label="Search users"
            placeholder="Name, email, or phone"
            onSearch={(value) =>
              setFilters((current) => ({
                ...current,
                searchTerm: value || undefined,
                page: 1,
              }))
            }
          />
        </CardContent>
      </Card>
      {query.isPending && <AdminLoading />}
      {query.error && (
        <AdminError error={query.error} retry={() => void query.refetch()} />
      )}
      {query.data && (
        <Card>
          <CardContent className="space-y-4">
            {query.data.data.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {[
                      "Name",
                      "Email",
                      "Phone",
                      "Role",
                      "Account status",
                      "Actions",
                    ].map((title) => (
                      <TableHead key={title}>{title}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name}
                        {actor?.id === user.id && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "CUSTOMER" ? "outline" : "secondary"
                          }
                        >
                          {user.role.replaceAll("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isBlocked ? "destructive" : "outline"}
                        >
                          {user.isBlocked ? "Blocked" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {actor?.role === "SUPER_ADMIN" &&
                            actor.id !== user.id && (
                              <Select
                                value={user.role}
                                disabled={busy}
                                onValueChange={(role) => {
                                  if (role) changeRole(user, role);
                                }}
                              >
                                <SelectTrigger
                                  className="w-32"
                                  aria-label={`Role for ${user.name}`}
                                >
                                  <SelectValue>
                                    {user.role.replaceAll("_", " ")}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false}>
                                  {roles.map((role) => (
                                    <SelectItem key={role} value={role}>
                                      {role.replaceAll("_", " ")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          {(actor?.role === "ADMIN" ||
                            actor?.role === "SUPER_ADMIN") &&
                            user.role === "CUSTOMER" &&
                            actor.id !== user.id && (
                              <Toggle
                                label={`Block ${user.name}`}
                                checked={user.isBlocked}
                                disabled={busy}
                                onChange={() => changeBlocked(user)}
                              />
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">
                No users match your search.
              </p>
            )}
            {query.data.meta && (
              <AdminPagination
                meta={query.data.meta}
                label="users"
                onPage={(page) =>
                  setFilters((current) => ({ ...current, page }))
                }
              />
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
