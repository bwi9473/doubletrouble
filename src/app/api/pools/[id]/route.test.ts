import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    pool: {
      findUnique: findUniqueMock,
      delete: deleteMock,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("/api/pools/[id] DELETE", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    deleteMock.mockReset();
  });

  it("returns forbidden for non-admin users", async () => {
    const { DELETE } = await import("@/app/api/pools/[id]/route");

    const request = new Request("http://localhost/api/pools/p1", {
      method: "DELETE",
      headers: {
        "x-demo-role": "viewer",
      },
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "p1" }) });
    expect(response.status).toBe(403);
  });

  it("returns not found when pool does not exist", async () => {
    const { DELETE } = await import("@/app/api/pools/[id]/route");
    findUniqueMock.mockResolvedValue(null);

    const request = new Request("http://localhost/api/pools/p1", {
      method: "DELETE",
      headers: {
        "x-demo-role": "admin",
      },
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "p1" }) });
    expect(response.status).toBe(404);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes pool for admin users", async () => {
    const { DELETE } = await import("@/app/api/pools/[id]/route");
    findUniqueMock.mockResolvedValue({ id: "p1" });
    deleteMock.mockResolvedValue({ id: "p1" });

    const request = new Request("http://localhost/api/pools/p1", {
      method: "DELETE",
      headers: {
        "x-demo-role": "admin",
      },
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: "p1" }) });

    expect(response.status).toBe(204);
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: "p1" } });
  });
});
