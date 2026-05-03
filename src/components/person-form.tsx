"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, uploadImage } from "@/lib/client-api";
import { useRoleStore } from "@/store/use-role-store";

const defaultForm = {
  name: "",
  rankingLabel: "",
  rankingValue: "",
  photoUrl: "",
  password: "",
};

export function PersonForm() {
  const router = useRouter();
  const role = useRoleStore((state) => state.role);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const disabled = role !== "admin";

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const uploadedUrl = await uploadImage(file, role);
      setForm((current) => ({
        ...current,
        photoUrl: uploadedUrl,
      }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload mislukt.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await apiFetch("/api/persons", role, {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          rankingLabel: form.rankingLabel,
          rankingValue: form.rankingValue ? Number(form.rankingValue) : undefined,
          photoUrl: form.photoUrl || undefined,
          password: form.password || undefined,
        }),
      });
      setForm(defaultForm);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Opslaan mislukt.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span>Naam</span>
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="ui-input rounded-2xl px-4 py-3"
            placeholder="Bijv. Sam"
            disabled={disabled || pending}
            required
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span>Klassement</span>
          <input
            value={form.rankingLabel}
            onChange={(event) =>
              setForm((current) => ({ ...current, rankingLabel: event.target.value }))
            }
            className="ui-input rounded-2xl px-4 py-3"
            placeholder="Bijv. P200 / Beginner / 4"
            disabled={disabled || pending}
            required
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm">
        <span>Paswoord</span>
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          className="ui-input rounded-2xl px-4 py-3"
          placeholder="Laat leeg om naam als paswoord te gebruiken"
          disabled={disabled || pending}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span>Klassement waarde</span>
          <input
            type="number"
            value={form.rankingValue}
            onChange={(event) =>
              setForm((current) => ({ ...current, rankingValue: event.target.value }))
            }
            className="ui-input rounded-2xl px-4 py-3"
            placeholder="Bijv. 4"
            disabled={disabled || pending}
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span>Foto URL</span>
          <input
            value={form.photoUrl}
            onChange={(event) => setForm((current) => ({ ...current, photoUrl: event.target.value }))}
            className="ui-input rounded-2xl px-4 py-3"
            placeholder="https://..."
            disabled={disabled || pending || uploading}
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm">
        <span>Of upload een foto</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="ui-card-dashed rounded-2xl px-4 py-3 text-sm"
          disabled={disabled || pending || uploading}
        />
      </label>
      {uploading ? (
        <div className="text-xs text-app-muted">Foto uploaden...</div>
      ) : null}
      {form.photoUrl ? (
        <div className="text-xs text-app-accent">Foto geselecteerd en klaar om op te slaan.</div>
      ) : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button
        type="submit"
        disabled={disabled || pending || uploading}
        className="ui-button-primary rounded-2xl px-4 py-3 font-semibold disabled:cursor-not-allowed"
      >
        {disabled ? "Alleen admin kan spelers beheren" : pending ? "Opslaan..." : uploading ? "Uploaden..." : "Speler toevoegen"}
      </button>
    </form>
  );
}
