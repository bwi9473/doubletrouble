import { beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.fn();
const findManyMock = vi.fn();
const appUserFindUniqueMock = vi.fn();
const appUserCreateMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    person: {
      create: createMock,
      findMany: findManyMock,
    },
    appUser: {
      findUnique: appUserFindUniqueMock,
      create: appUserCreateMock,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("/api/persons", () => {
  beforeEach(() => {
    createMock.mockReset();
    findManyMock.mockReset();
    appUserFindUniqueMock.mockReset();
    appUserCreateMock.mockReset();
  });

  it("returns forbidden for non-admin users on POST", async () => {
    const { POST } = await import("@/app/api/persons/route");
    const request = new Request("http://localhost/api/persons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-demo-role": "viewer",
      },
      body: JSON.stringify({
        name: "Sam",
        rankingLabel: "P200",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it("creates a person for admins", async () => {
    const { POST } = await import("@/app/api/persons/route");
    createMock.mockResolvedValue({ id: "person-1", name: "Sam", rankingLabel: "P200" });
    appUserFindUniqueMock.mockResolvedValue(null);
    appUserCreateMock.mockResolvedValue({ id: "user-1" });

    const request = new Request("http://localhost/api/persons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-demo-role": "admin",
      },
      body: JSON.stringify({
        name: "Sam",
        rankingLabel: "P200",
        rankingValue: 2,
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith({
      data: {
        name: "Sam",
        photoUrl: undefined,
        rankingLabel: "P200",
        rankingValue: 2,
      },
    });
    expect(appUserCreateMock).toHaveBeenCalledWith({
      data: {
        name: "Sam",
        username: "sam",
        password: "sam",
        role: "VIEWER",
        personId: "person-1",
      },
    });
    expect(payload).toMatchObject({ id: "person-1", name: "Sam" });
  });
});
