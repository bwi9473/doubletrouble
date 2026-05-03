"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DemoRole } from "@/lib/types";

export type UserRole = "VIEWER" | "ADMIN" | "MATCH_MANAGER";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  personId?: string | null;
};

function toDemoRole(role: UserRole): DemoRole {
  switch (role) {
    case "ADMIN": return "admin";
    case "MATCH_MANAGER": return "match-manager";
    default: return "viewer";
  }
}

type RoleStore = {
  user: AuthUser | null;
  role: DemoRole;
  setUser: (user: AuthUser | null) => void;
  setRole: (role: DemoRole) => void;
  logout: () => void;
};

export const useRoleStore = create<RoleStore>()(
  persist(
    (set) => ({
      user: null,
      role: "admin",
      setUser: (user) => set({ user, role: user ? toDemoRole(user.role) : "admin" }),
      setRole: (role) => set({ role }),
      logout: () => set({ user: null, role: "admin" }),
    }),
    {
      name: "padel-role-store",
    },
  ),
);
