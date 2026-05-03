import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatRoleLabel(role: string) {
  return role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPoolStatus(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Actief";
    case "COMPLETED":
      return "Afgerond";
    case "ARCHIVED":
      return "Gearchiveerd";
    default:
      return status;
  }
}

export function isPhotoDataUrl(value?: string | null) {
  return Boolean(value?.startsWith("data:image/"));
}
