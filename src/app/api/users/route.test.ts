import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();
const createMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    appUser: {
      findMany: findManyMock,
      create: createMock,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("/api/users", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    createMock.mockReset();
  });

  it("returns forbidden for non-admin users", async () => {
    const { GET } = await import("@/app/api/users/route");

    const request = new Request("http://localhost/api/users", {
      method: "GET",
      headers: {
        "x-demo-role": "viewer",
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(403);
  });

  it("creates a user for admin role", async () => {
    const { POST } = await import("@/app/api/users/route");
    createMock.mockResolvedValue({
      id: "u1",
      name: "Admin User",
      username: "admin.user",
      role: "ADMIN",
    });

    const request = new Request("http://localhost/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-demo-role": "admin",
      },
      body: JSON.stringify({
        name: "Admin User",
        username: "Admin.User",
        password: "secret123",
        role: "ADMIN",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith({
      data: {
        name: "Admin User",
        username: "admin.user",
        password: "secret123",
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });
  });
});
