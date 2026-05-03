import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { demoRoles, type DemoRole } from "@/lib/types";

function isDemoRole(value: string): value is DemoRole {
  return demoRoles.includes(value as DemoRole);
}

export function getRoleFromRequest(request: Request): DemoRole {
  const headerRole = request.headers.get("x-demo-role")?.toLowerCase();
  if (headerRole && isDemoRole(headerRole)) {
    return headerRole;
  }

  return "viewer";
}

export function mapDemoRoleToUserRole(role: DemoRole): UserRole {
  switch (role) {
    case "admin":
      return "ADMIN";
    case "match-manager":
      return "MATCH_MANAGER";
    default:
      return "VIEWER";
  }
}

export function mapUserRoleToDemoRole(role: UserRole): DemoRole {
  switch (role) {
    case "ADMIN":
      return "admin";
    case "MATCH_MANAGER":
      return "match-manager";
    default:
      return "viewer";
  }
}

export function ensureRole(request: Request, allowedRoles: DemoRole[]) {
  const role = getRoleFromRequest(request);

  if (!allowedRoles.includes(role)) {
    return {
      ok: false as const,
      role,
      response: NextResponse.json(
        {
          error: "Onvoldoende rechten voor deze actie.",
          role,
        },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    role,
  };
}
