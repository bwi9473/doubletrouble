import type { DemoRole } from "@/lib/types";

type UploadedImageResponse = {
  url: string;
};

export async function apiFetch<T>(
  input: RequestInfo | URL,
  role: DemoRole,
  init: RequestInit = {},
  userId?: string,
): Promise<T> {
  const isFormDataBody = typeof FormData !== "undefined" && init.body instanceof FormData;

  const baseHeaders: HeadersInit = {
    "x-demo-role": role,
    ...(userId ? { "x-user-id": userId } : {}),
  };

  const headers: HeadersInit = isFormDataBody
    ? {
        ...baseHeaders,
        ...(init.headers ?? {}),
      }
    : {
        "Content-Type": "application/json",
        ...baseHeaders,
        ...(init.headers ?? {}),
      };

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Er ging iets mis bij het verwerken van de aanvraag.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function uploadImage(file: File, role: DemoRole, userId?: string) {
  const formData = new FormData();
  formData.append("file", file);

  const result = await apiFetch<UploadedImageResponse>(
    "/api/uploads/image",
    role,
    {
      method: "POST",
      body: formData,
    },
    userId,
  );

  return result.url;
}
