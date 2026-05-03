"use client";

import Link from "next/link";
import { useRoleStore } from "@/store/use-role-store";
import type { UserRole } from "@/store/use-role-store";

type NavItem = {
  href: string;
  label: string;
  allowedRoles: UserRole[];
};

const navigationItems: NavItem[] = [
  { href: "/", label: "Dashboard", allowedRoles: ["VIEWER", "ADMIN", "MATCH_MANAGER"] },
  { href: "/spelers", label: "Spelers", allowedRoles: ["ADMIN"] },
  { href: "/poules", label: "Poules", allowedRoles: ["ADMIN", "MATCH_MANAGER"] },
  { href: "/wedstrijden", label: "Wedstrijden", allowedRoles: ["VIEWER", "ADMIN", "MATCH_MANAGER"] },
  { href: "/klassement", label: "Klassement", allowedRoles: ["VIEWER", "ADMIN", "MATCH_MANAGER"] },
  { href: "/gebruikers", label: "Gebruikers", allowedRoles: ["ADMIN"] },
];

export function MainNav() {
  const user = useRoleStore((state) => state.user);

  if (!user) {
    return null;
  }

  const visibleItems = navigationItems.filter((item) =>
    item.allowedRoles.includes(user.role),
  );

  return (
    <nav className="grid w-full grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
      {visibleItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="ui-nav-link px-2 py-2 text-[0.78rem] sm:px-4 sm:py-2.5 sm:text-sm"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
