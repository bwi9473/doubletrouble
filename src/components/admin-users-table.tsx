"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { apiFetch } from "@/lib/client-api";
import { useRoleStore } from "@/store/use-role-store";

type AppUserRecord = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
};

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "VIEWER", label: "Viewer" },
  { value: "MATCH_MANAGER", label: "Wedstrijd gebruiker" },
  { value: "ADMIN", label: "Admin" },
];

export function AdminUsersTable({ users }: { users: AppUserRecord[] }) {
  const router = useRouter();
  const role = useRoleStore((state) => state.role);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  async function updateUser(user: AppUserRecord, nextRole: UserRole) {
    setPendingUserId(user.id);

    try {
      await apiFetch(`/api/users/${user.id}`, role, {
        method: "PATCH",
        body: JSON.stringify({
          name: user.name,
          username: user.username,
          role: nextRole,
        }),
      });
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Wijzigen mislukt.");
    } finally {
      setPendingUserId(null);
    }
  }

  async function deleteUser(userId: string) {
    setPendingUserId(userId);
    try {
      await apiFetch(`/api/users/${userId}`, role, { method: "DELETE" });
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Verwijderen mislukt.");
    } finally {
      setPendingUserId(null);
    }
  }

  if (!users.length) {
    return (
      <div className="ui-card-dashed rounded-3xl p-6 text-center text-sm text-app-muted">
        Nog geen gebruikers. Voeg een gebruiker toe via het formulier.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <article key={user.id} className="ui-card rounded-3xl p-4">
          <div className="grid gap-3 sm:grid-cols-[1.2fr,1fr,auto] sm:items-center">
            <div>
              <p className="font-semibold text-app-foreground">{user.name}</p>
              <p className="text-sm text-app-muted">@{user.username}</p>
            </div>
            <select
              value={user.role}
              onChange={(event) => updateUser(user, event.target.value as UserRole)}
              disabled={role !== "admin" || pendingUserId === user.id}
              className="ui-input ui-select rounded-2xl px-4 py-3 text-sm"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => deleteUser(user.id)}
              disabled={role !== "admin" || pendingUserId === user.id}
              className="ui-button-danger rounded-2xl px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Verwijderen
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
