import type { GeneratedMatch, PlayerLite, Team } from "@/lib/types";

export type CompetitionFormat = "FULL" | "SHORT";

function createTeam(player1: PlayerLite, player2: PlayerLite): Team {
  return {
    player1,
    player2,
  };
}

export function generateUniqueTeams(players: PlayerLite[]) {
  const teams: Team[] = [];

  for (let first = 0; first < players.length - 1; first += 1) {
    for (let second = first + 1; second < players.length; second += 1) {
      teams.push(createTeam(players[first], players[second]));
    }
  }

  return teams;
}

function combinations(count: number, pick: number): number {
  if (pick < 0 || pick > count) {
    return 0;
  }

  if (pick === 0 || pick === count) {
    return 1;
  }

  const k = Math.min(pick, count - pick);
  let result = 1;
  for (let i = 1; i <= k; i += 1) {
    result = (result * (count - k + i)) / i;
  }
  return Math.round(result);
}

export function isShortCompetitionFeasible(playerCount: number, duoTarget: number): boolean {
  if (playerCount < 4 || duoTarget < 1) {
    return false;
  }

  return (duoTarget * playerCount * (playerCount - 1)) % 4 === 0;
}

export function findFirstFeasibleDuoTarget(
  playerCount: number,
  minTarget = 1,
  maxTarget = 12,
): number | null {
  for (let value = minTarget; value <= maxTarget; value += 1) {
    if (isShortCompetitionFeasible(playerCount, value)) {
      return value;
    }
  }

  return null;
}

export function calculateFullCompetitionMatches(playerCount: number): number {
  if (playerCount < 4) {
    return 0;
  }

  return 3 * combinations(playerCount, 4);
}

export function calculateShortCompetitionMatches(playerCount: number, duoTarget: number): number | null {
  if (!isShortCompetitionFeasible(playerCount, duoTarget)) {
    return null;
  }

  return (duoTarget * playerCount * (playerCount - 1)) / 4;
}

export function calculateCompetitionMatches(
  playerCount: number,
  competitionFormat: CompetitionFormat,
  duoTarget: number,
): number | null {
  if (competitionFormat === "FULL") {
    return calculateFullCompetitionMatches(playerCount);
  }

  return calculateShortCompetitionMatches(playerCount, duoTarget);
}

function generateFullCompetitionMatches(players: PlayerLite[]): GeneratedMatch[] {
  if (players.length < 4) {
    return [];
  }

  const seen = new Set<string>();
  const matches: GeneratedMatch[] = [];

  for (let a = 0; a < players.length - 3; a += 1) {
    for (let b = a + 1; b < players.length - 2; b += 1) {
      for (let c = b + 1; c < players.length - 1; c += 1) {
        for (let d = c + 1; d < players.length; d += 1) {
          const subset = [players[a], players[b], players[c], players[d]];
          const pairings = [
            [
              [subset[0], subset[1]],
              [subset[2], subset[3]],
            ],
            [
              [subset[0], subset[2]],
              [subset[1], subset[3]],
            ],
            [
              [subset[0], subset[3]],
              [subset[1], subset[2]],
            ],
          ] as const;

          for (const pairing of pairings) {
            const team1 = createTeam(pairing[0][0], pairing[0][1]);
            const team2 = createTeam(pairing[1][0], pairing[1][1]);

            const team1Key = [team1.player1.id, team1.player2.id].sort().join("+");
            const team2Key = [team2.player1.id, team2.player2.id].sort().join("+");
            const matchKey = [team1Key, team2Key].sort().join("__vs__");

            if (seen.has(matchKey)) {
              continue;
            }

            seen.add(matchKey);
            matches.push({
              id: `match-${matches.length + 1}`,
              team1,
              team2,
            });
          }
        }
      }
    }
  }

  return matches;
}

type TeamEdge = {
  id: string;
  player1: PlayerLite;
  player2: PlayerLite;
};

function areDisjoint(edgeA: TeamEdge, edgeB: TeamEdge): boolean {
  const ids = [edgeA.player1.id, edgeA.player2.id, edgeB.player1.id, edgeB.player2.id];
  return new Set(ids).size === 4;
}

function hasDeadEnd(
  remaining: Set<string>,
  partnerMap: Map<string, string[]>,
): boolean {
  for (const id of remaining) {
    const options = (partnerMap.get(id) ?? []).filter((partner) => remaining.has(partner));
    if (!options.length) {
      return true;
    }
  }

  return false;
}

function pairEdgesIntoMatches(edges: TeamEdge[]): Array<{ edgeA: TeamEdge; edgeB: TeamEdge }> {
  const ids = edges.map((edge) => edge.id);
  const edgesById = new Map(edges.map((edge) => [edge.id, edge]));

  const partnerMap = new Map<string, string[]>();
  for (const edge of edges) {
    partnerMap.set(
      edge.id,
      edges.filter((candidate) => candidate.id !== edge.id && areDisjoint(edge, candidate)).map((candidate) => candidate.id),
    );
  }

  const attempts = 160;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const remaining = new Set(ids);
    const matches: Array<{ edgeA: TeamEdge; edgeB: TeamEdge }> = [];

    while (remaining.size > 0) {
      const currentId = Array.from(remaining).sort((left, right) => {
        const leftOptions = (partnerMap.get(left) ?? []).filter((candidate) => remaining.has(candidate)).length;
        const rightOptions = (partnerMap.get(right) ?? []).filter((candidate) => remaining.has(candidate)).length;
        if (leftOptions !== rightOptions) {
          return leftOptions - rightOptions;
        }
        return left.localeCompare(right);
      })[0];

      const options = (partnerMap.get(currentId) ?? []).filter((candidate) => remaining.has(candidate));
      if (!options.length) {
        break;
      }

      const rotation = attempt % options.length;
      const rotated = options.slice(rotation).concat(options.slice(0, rotation));

      let selectedPartner: string | null = null;
      for (const candidate of rotated) {
        remaining.delete(currentId);
        remaining.delete(candidate);

        const deadEnd = hasDeadEnd(remaining, partnerMap);

        remaining.add(currentId);
        remaining.add(candidate);

        if (!deadEnd) {
          selectedPartner = candidate;
          break;
        }
      }

      if (!selectedPartner) {
        selectedPartner = rotated[0];
      }

      const edgeA = edgesById.get(currentId);
      const edgeB = edgesById.get(selectedPartner);

      if (!edgeA || !edgeB) {
        break;
      }

      matches.push({ edgeA, edgeB });
      remaining.delete(currentId);
      remaining.delete(selectedPartner);
    }

    if (!remaining.size) {
      return matches;
    }
  }

  throw new Error("Geen geldige wedstrijdverdeling gevonden. Kies een andere duo-instelling.");
}

function generateShortCompetitionMatches(players: PlayerLite[], duoTarget: number): GeneratedMatch[] {
  if (players.length < 4) {
    return [];
  }

  if (!isShortCompetitionFeasible(players.length, duoTarget)) {
    throw new Error("Deze verkorte competitie is niet mogelijk met dit aantal spelers.");
  }

  const edges: TeamEdge[] = [];
  for (let first = 0; first < players.length - 1; first += 1) {
    for (let second = first + 1; second < players.length; second += 1) {
      for (let repeat = 0; repeat < duoTarget; repeat += 1) {
        edges.push({
          id: `${players[first].id}+${players[second].id}#${repeat + 1}`,
          player1: players[first],
          player2: players[second],
        });
      }
    }
  }

  const paired = pairEdgesIntoMatches(edges);

  return paired.map((match, index) => ({
    id: `match-${index + 1}`,
    team1: createTeam(match.edgeA.player1, match.edgeA.player2),
    team2: createTeam(match.edgeB.player1, match.edgeB.player2),
  }));
}

export function generateUniqueMatches(
  players: PlayerLite[],
  competitionFormat: CompetitionFormat = "FULL",
  duoTarget = 1,
): GeneratedMatch[] {
  if (competitionFormat === "SHORT") {
    return generateShortCompetitionMatches(players, duoTarget);
  }

  return generateFullCompetitionMatches(players);
}
