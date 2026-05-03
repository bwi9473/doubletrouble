import { ClientAppShell } from "@/components/client-app-shell";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <ClientAppShell>{children}</ClientAppShell>;
}
