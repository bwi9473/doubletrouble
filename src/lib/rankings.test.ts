import { describe, expect, it } from "vitest";
import { calculateRankings } from "@/lib/rankings";

const players = [
  { id: "a", name: "A" },
  { id: "b", name: "B" },
  { id: "c", name: "C" },
  { id: "d", name: "D" },
];

describe("calculateRankings", () => {
  it("awards points, games won, games lost and sorts correctly", () => {
    const rankings = calculateRankings(players, [
      {
        team1: [players[0], players[1]],
        team2: [players[2], players[3]],
        score: { team1Games: 6, team2Games: 3 },
      },
      {
        team1: [players[0], players[2]],
        team2: [players[1], players[3]],
        score: { team1Games: 5, team2Games: 5 },
      },
    ]);

    expect(rankings.map((entry) => entry.name)).toEqual(["A", "B", "C", "D"]);
    expect(rankings[0]).toMatchObject({
      points: 3,
      gamesWon: 11,
      gamesLost: 8,
      gameDifference: 3,
      matchesPlayed: 2,
    });
    expect(rankings[3]).toMatchObject({
      points: 1,
      gamesWon: 8,
      gamesLost: 11,
      gameDifference: -3,
      matchesPlayed: 2,
    });
  });
});
