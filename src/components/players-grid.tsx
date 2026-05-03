"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, uploadImage } from "@/lib/client-api";
import { EmptyState } from "@/components/empty-state";
import { useRoleStore } from "@/store/use-role-store";

type PersonRecord = {
  id: string;
  name: string;
  rankingLabel: string;
  rankingValue: number | null;
  photoUrl?: string | null;
  viewAccesses: Array<{
    poolId: string;
  }>;
};

type PoolOption = {
  id: string;
  name: string;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
};

export function PlayersGrid({ persons, pools }: { persons: PersonRecord[]; pools: PoolOption[] }) {
  const router = useRouter();
  const role = useRoleStore((state) => state.role);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingPerson, setEditingPerson] = useState<PersonRecord | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    rankingLabel: "",
    rankingValue: "",
    photoUrl: "",
  });
  const [selectedPoolIds, setSelectedPoolIds] = useState<string[]>([]);

  function startEdit(person: PersonRecord) {
    setUpdateError(null);
    setEditingPerson(person);
    setEditForm({
      name: person.name,
      rankingLabel: person.rankingLabel,
      rankingValue: person.rankingValue?.toString() ?? "",
      photoUrl: person.photoUrl ?? "",
    });
    setSelectedPoolIds(person.viewAccesses.map((access) => access.poolId));
  }

  function closeEdit() {
    setEditingPerson(null);
    setUpdateError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleEditFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUpdateError(null);
    setUploading(true);

    try {
      const uploadedUrl = await uploadImage(file, role);
      setEditForm((current) => ({
        ...current,
        photoUrl: uploadedUrl,
      }));
    } catch (uploadError) {
      setUpdateError(uploadError instanceof Error ? uploadError.message : "Upload mislukt.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingPerson) {
      return;
    }

    setPendingUpdate(true);
    setUpdateError(null);

    try {
      await apiFetch(`/api/persons/${editingPerson.id}`, role, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name,
          rankingLabel: editForm.rankingLabel,
          rankingValue: editForm.rankingValue ? Number(editForm.rankingValue) : undefined,
          photoUrl: editForm.photoUrl || undefined,
          visiblePoolIds: selectedPoolIds,
        }),
      });
      closeEdit();
      router.refresh();
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "Bijwerken mislukt.");
    } finally {
      setPendingUpdate(false);
    }
  }

  async function handleDelete(personId: string) {
    try {
      await apiFetch(`/api/persons/${personId}`, role, { method: "DELETE" });
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Verwijderen mislukt.");
    }
  }

  if (!persons.length) {
    return (
      <EmptyState
        title="Nog geen spelers"
        description="Voeg spelers toe om poules en wedstrijden te kunnen genereren."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {persons.map((person) => (
        <article key={person.id} className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-slate-800">
              {person.photoUrl ? (
                <Image src={person.photoUrl} alt={person.name} fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-lg font-semibold text-emerald-300">
                  {person.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold">{person.name}</h3>
              <p className="text-sm text-slate-300">Klassement: {person.rankingLabel}</p>
              <p className="text-xs text-slate-400">
                Scorewaarde: {person.rankingValue ?? "Niet ingesteld"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end">
            <button
              type="button"
              onClick={() => startEdit(person)}
              disabled={role !== "admin"}
              className="mr-2 rounded-2xl border border-sky-400/40 px-3 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-400/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500"
            >
              Bewerken
            </button>
            <button
              type="button"
              onClick={() => handleDelete(person.id)}
              disabled={role !== "admin"}
              className="rounded-2xl border border-rose-400/40 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500"
            >
              Verwijderen
            </button>
          </div>
        </article>
      ))}

      {editingPerson ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 px-4">
          <form onSubmit={handleUpdate} className="ui-card w-full max-w-xl rounded-3xl p-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-app-foreground">Speler bewerken</h3>
              <p className="text-sm text-app-muted">Pas naam, klassement en foto aan.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-app-foreground">
                <span>Naam</span>
                <input
                  value={editForm.name}
                  onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                  className="ui-input rounded-2xl px-4 py-3"
                  disabled={pendingUpdate}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm text-app-foreground">
                <span>Klassement</span>
                <input
                  value={editForm.rankingLabel}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, rankingLabel: event.target.value }))
                  }
                  className="ui-input rounded-2xl px-4 py-3"
                  disabled={pendingUpdate}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm text-app-foreground">
                <span>Klassement waarde</span>
                <input
                  type="number"
                  value={editForm.rankingValue}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, rankingValue: event.target.value }))
                  }
                  className="ui-input rounded-2xl px-4 py-3"
                  disabled={pendingUpdate}
                />
              </label>
              <label className="grid gap-2 text-sm text-app-foreground">
                <span>Foto URL</span>
                <input
                  value={editForm.photoUrl}
                  onChange={(event) => setEditForm((current) => ({ ...current, photoUrl: event.target.value }))}
                  className="ui-input rounded-2xl px-4 py-3"
                  disabled={pendingUpdate || uploading}
                  placeholder="https://..."
                />
              </label>
            </div>
            <label className="mt-3 grid gap-2 text-sm text-app-foreground">
              <span>Of upload een foto</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleEditFileChange}
                className="rounded-2xl border border-dashed border-white/20 bg-slate-950/60 px-4 py-3 text-sm"
                disabled={pendingUpdate || uploading}
              />
            </label>
            <div className="mt-3">
              <p className="mb-2 text-sm font-medium text-app-foreground">Toegang tot poules</p>
              {pools.length ? (
                <div className="grid max-h-40 gap-2 overflow-y-auto rounded-2xl border border-white/15 bg-slate-950/40 p-3 sm:grid-cols-2">
                  {pools.map((pool) => {
                    const checked = selectedPoolIds.includes(pool.id);
                    return (
                      <label
                        key={pool.id}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-app-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={pendingUpdate || uploading}
                          onChange={(event) => {
                            setSelectedPoolIds((current) => {
                              if (event.target.checked) {
                                return [...current, pool.id];
                              }

                              return current.filter((poolId) => poolId !== pool.id);
                            });
                          }}
                        />
                        <span className="truncate">{pool.name}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-app-muted">Nog geen poules beschikbaar.</p>
              )}
            </div>
            {uploading ? <p className="mt-2 text-xs text-app-muted">Foto uploaden...</p> : null}
            <div className="mt-3 rounded-2xl border border-white/15 bg-slate-950/60 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-app-muted">Preview</p>
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/20 bg-slate-900/60 sm:h-16 sm:w-16">
                  <Image
                    src={editForm.photoUrl || "/default-head-perspective.svg"}
                    alt={editForm.name || "Speler preview"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-app-foreground">{editForm.name || "Naam preview"}</p>
                  <p className="text-xs text-app-muted">{editForm.rankingLabel || "Klassement preview"}</p>
                </div>
              </div>
            </div>
            {updateError ? <p className="mt-3 text-sm text-rose-300">{updateError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                disabled={pendingUpdate || uploading}
                className="rounded-2xl border border-app px-4 py-2 text-sm text-app-foreground"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={pendingUpdate || uploading}
                className="ui-button-primary rounded-2xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed"
              >
                {pendingUpdate ? "Opslaan..." : uploading ? "Uploaden..." : "Wijzigingen opslaan"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
