import { describe, expect, it } from "vitest";
import {
  calculateCompetitionMatches,
  findFirstFeasibleDuoTarget,
  generateUniqueMatches,
  generateUniqueTeams,
  isShortCompetitionFeasible,
} from "@/lib/schedule";

const players = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map((name) => ({
  id: name.toLowerCase(),
  name,
}));

describe("generateUniqueTeams", () => {
  it("builds every unique team of two players", () => {
    const teams = generateUniqueTeams(players);
    const expectedCount = (players.length * (players.length - 1)) / 2;

    expect(teams).toHaveLength(expectedCount);
    expect(teams.map((team) => `${team.player1.name}${team.player2.name}`)).toContain("AB");
    expect(teams.map((team) => `${team.player1.name}${team.player2.name}`)).toContain("IJ");
  });
});

describe("generateUniqueMatches", () => {
  it("creates valid doubles matches without overlapping players", () => {
    const matches = generateUniqueMatches(players);

    expect(matches.length).toBeGreaterThan(0);

    for (const match of matches) {
      const ids = [
        match.team1.player1.id,
        match.team1.player2.id,
        match.team2.player1.id,
        match.team2.player2.id,
      ];

      expect(new Set(ids).size).toBe(4);
    }
  });

  it("creates 3 matches for exactly 4 players", () => {
    const fourPlayers = players.slice(0, 4);
    const matches = generateUniqueMatches(fourPlayers);

    expect(matches).toHaveLength(3);
  });

  it("creates 15 matches for exactly 5 players", () => {
    const fivePlayers = players.slice(0, 5);
    const matches = generateUniqueMatches(fivePlayers);

    expect(matches).toHaveLength(15);
  });

  it("creates equal duo repetition in short competition", () => {
    const sixPlayers = players.slice(0, 6);
    const duoTarget = 2;
    const matches = generateUniqueMatches(sixPlayers, "SHORT", duoTarget);

    const duoCounts = new Map<string, number>();
    for (const match of matches) {
      const pairs = [
        [match.team1.player1.id, match.team1.player2.id],
        [match.team2.player1.id, match.team2.player2.id],
      ];

      for (const pair of pairs) {
        const key = pair.sort().join("+");
        duoCounts.set(key, (duoCounts.get(key) ?? 0) + 1);
      }
    }

    for (let first = 0; first < sixPlayers.length - 1; first += 1) {
      for (let second = first + 1; second < sixPlayers.length; second += 1) {
        const key = [sixPlayers[first].id, sixPlayers[second].id].sort().join("+");
        expect(duoCounts.get(key)).toBe(duoTarget);
      }
    }
  });

  it("ensures every player teams up with every other player at least once", () => {
    const matches = generateUniqueMatches(players);
    const pairKeys = new Set<string>();

    for (const match of matches) {
      pairKeys.add([match.team1.player1.id, match.team1.player2.id].sort().join("+"));
      pairKeys.add([match.team2.player1.id, match.team2.player2.id].sort().join("+"));
    }

    for (let first = 0; first < players.length - 1; first += 1) {
      for (let second = first + 1; second < players.length; second += 1) {
        expect(pairKeys.has([players[first].id, players[second].id].sort().join("+"))).toBe(true);
      }
    }
  });

  it("ensures every player has the same number of matches in a full-combination pool", () => {
    for (let size = 4; size <= 10; size += 1) {
      const subset = players.slice(0, size);
      const matches = generateUniqueMatches(subset);

      const perPlayerMatches = new Map<string, number>();
      for (const player of subset) {
        perPlayerMatches.set(player.id, 0);
      }

      for (const match of matches) {
        const ids = [
          match.team1.player1.id,
          match.team1.player2.id,
          match.team2.player1.id,
          match.team2.player2.id,
        ];

        ids.forEach((id) => {
          perPlayerMatches.set(id, (perPlayerMatches.get(id) ?? 0) + 1);
        });
      }

      const values = Array.from(perPlayerMatches.values());
      expect(new Set(values).size).toBe(1);
    }
  });

  it("calculates match totals for full and short competition", () => {
    expect(calculateCompetitionMatches(5, "FULL", 1)).toBe(15);
    expect(calculateCompetitionMatches(6, "SHORT", 2)).toBe(15);
    expect(calculateCompetitionMatches(6, "SHORT", 1)).toBeNull();
    expect(isShortCompetitionFeasible(6, 2)).toBe(true);
    expect(isShortCompetitionFeasible(6, 1)).toBe(false);
  });

  it("finds the first feasible duo target", () => {
    expect(findFirstFeasibleDuoTarget(7)).toBe(2);
    expect(findFirstFeasibleDuoTarget(6)).toBe(2);
    expect(findFirstFeasibleDuoTarget(4)).toBe(1);
  });
});
