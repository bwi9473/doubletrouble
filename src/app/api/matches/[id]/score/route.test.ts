import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const upsertMock = vi.fn();
const countMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    match: {
      findUnique: findUniqueMock,
      count: countMock,
    },
    matchScore: {
      upsert: upsertMock,
      count: countMock,
    },
    pool: {
      update: updateMock,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("/api/matches/[id]/score", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    upsertMock.mockReset();
    countMock.mockReset();
    updateMock.mockReset();
  });

  it("blocks viewer role from submitting scores", async () => {
    const { POST } = await import("@/app/api/matches/[id]/score/route");

    findUniqueMock.mockResolvedValue({
      id: "m1",
      poolId: "p1",
      team1Player1Id: "a",
      team1Player2Id: "b",
      team2Player1Id: "c",
      team2Player2Id: "d",
    });

    const request = new Request("http://localhost/api/matches/m1/score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-demo-role": "viewer",
      },
      body: JSON.stringify({ team1Games: 6, team2Games: 4 }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "m1" }) });
    expect(response.status).toBe(403);
  });

  it("accepts score submission for match-manager role", async () => {
    const { POST } = await import("@/app/api/matches/[id]/score/route");

    findUniqueMock.mockResolvedValue({
      id: "m1",
      poolId: "p1",
      team1Player1Id: "a",
      team1Player2Id: "b",
      team2Player1Id: "c",
      team2Player2Id: "d",
    });
    upsertMock.mockResolvedValue({ id: "s1", team1Games: 6, team2Games: 4 });
    countMock.mockResolvedValueOnce(1).mockResolvedValueOnce(1);
    updateMock.mockResolvedValue({ id: "p1", status: "COMPLETED" });

    const request = new Request("http://localhost/api/matches/m1/score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-demo-role": "match-manager",
      },
      body: JSON.stringify({ team1Games: 6, team2Games: 4 }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: "m1" }) });

    expect(response.status).toBe(200);
    expect(upsertMock).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { status: "COMPLETED" },
    });
  });
});
