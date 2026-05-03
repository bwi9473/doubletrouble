import { AdminUserForm } from "@/components/admin-user-form";
import { AdminUsersTable } from "@/components/admin-users-table";
import { SectionCard } from "@/components/section-card";
import { getAppUsers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function UsersAdminPage() {
  const users = await getAppUsers();

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
      <SectionCard
        title="Gebruiker toevoegen"
        description="Alleen admins kunnen gebruikers beheren en rollen toekennen."
      >
        <AdminUserForm />
      </SectionCard>
      <SectionCard
        title="Gebruikers en rollen"
        description="Pas bestaande rollen aan of verwijder gebruikers."
      >
        <AdminUsersTable users={users} />
      </SectionCard>
    </div>
  );
}
