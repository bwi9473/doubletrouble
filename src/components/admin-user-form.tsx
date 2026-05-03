"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import { useRoleStore } from "@/store/use-role-store";

const roleOptions = [
  { value: "VIEWER", label: "Viewer" },
  { value: "MATCH_MANAGER", label: "Wedstrijd gebruiker" },
  { value: "ADMIN", label: "Admin" },
] as const;

export function AdminUserForm() {
  const router = useRouter();
  const user = useRoleStore((state) => state.user);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState<(typeof roleOptions)[number]["value"]>("VIEWER");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const disabled = !user || user.role !== "ADMIN";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const demoRole = (user?.role || "VIEWER").toLowerCase() as "admin" | "viewer" | "match-manager";
      await apiFetch("/api/users", demoRole, {
        method: "POST",
        body: JSON.stringify({ name, username, password, role: userRole }),
      });

      setName("");
      setUsername("");
      setPassword("");
      setUserRole("VIEWER");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Opslaan mislukt.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <label className="grid gap-2 text-sm">
        <span>Naam</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="ui-input rounded-2xl px-4 py-3"
          placeholder="Bijv. Robin"
          disabled={disabled || pending}
          required
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span>Gebruikersnaam</span>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="ui-input rounded-2xl px-4 py-3"
          placeholder="robin"
          disabled={disabled || pending}
          required
          minLength={3}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span>Wachtwoord</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="ui-input rounded-2xl px-4 py-3"
          placeholder="••••••"
          disabled={disabled || pending}
          required
          minLength={6}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span>Rol</span>
        <select
          value={userRole}
          onChange={(event) => setUserRole(event.target.value as (typeof roleOptions)[number]["value"])}
          className="ui-input ui-select rounded-2xl px-4 py-3"
          disabled={disabled || pending}
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button
        type="submit"
        disabled={disabled || pending}
        className="ui-button-primary rounded-2xl px-4 py-3 font-semibold disabled:cursor-not-allowed"
      >
        {disabled ? "Alleen admin" : pending ? "Opslaan..." : "Gebruiker toevoegen"}
      </button>
    </form>
  );
}
