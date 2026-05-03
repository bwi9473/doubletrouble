"use client";

import { useRoleStore } from "@/store/use-role-store";

export function AuthButton() {
  const user = useRoleStore((state) => state.user);
  const logout = useRoleStore((state) => state.logout);

  const handleLogout = () => {
    document.cookie = "demo-role=; Path=/; Max-Age=0; SameSite=Lax";
    document.cookie = "demo-person-id=; Path=/; Max-Age=0; SameSite=Lax";
    logout();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-xs text-app-muted">Ingelogd als</p>
        <p className="text-sm font-medium text-app-foreground">{user.name}</p>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-2xl border border-app px-4 py-2 text-sm font-medium text-app-foreground transition hover:bg-white/10"
      >
        Uitloggen
      </button>
    </div>
  );
}
