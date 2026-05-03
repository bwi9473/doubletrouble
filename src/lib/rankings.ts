import type { RankingEntry, PlayerLite } from "@/lib/types";

type RankedMatchInput = {
  team1: [PlayerLite, PlayerLite];
  team2: [PlayerLite, PlayerLite];
  score?: {
    team1Games: number;
    team2Games: number;
  } | null;
};

function awardPoints(teamScore: number, opponentScore: number) {
  if (teamScore > opponentScore) {
    return 2;
  }

  if (teamScore === opponentScore) {
    return 1;
  }

  return 0;
}

export function calculateRankings(players: PlayerLite[], matches: RankedMatchInput[]) {
  const standings = new Map<string, RankingEntry>();

  for (const player of players) {
    standings.set(player.id, {
      ...player,
      points: 0,
      gamesWon: 0,
      gamesLost: 0,
      gameDifference: 0,
      matchesPlayed: 0,
    });
  }

  for (const match of matches) {
    if (!match.score) {
      continue;
    }

    const team1Points = awardPoints(match.score.team1Games, match.score.team2Games);
    const team2Points = awardPoints(match.score.team2Games, match.score.team1Games);

    for (const player of match.team1) {
      const current = standings.get(player.id);
      if (!current) {
        continue;
      }

      current.points += team1Points;
      current.gamesWon += match.score.team1Games;
      current.gamesLost += match.score.team2Games;
      current.matchesPlayed += 1;
      current.gameDifference = current.gamesWon - current.gamesLost;
    }

    for (const player of match.team2) {
      const current = standings.get(player.id);
      if (!current) {
        continue;
      }

      current.points += team2Points;
      current.gamesWon += match.score.team2Games;
      current.gamesLost += match.score.team1Games;
      current.matchesPlayed += 1;
      current.gameDifference = current.gamesWon - current.gamesLost;
    }
  }

  return Array.from(standings.values()).sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }

    if (right.gameDifference !== left.gameDifference) {
      return right.gameDifference - left.gameDifference;
    }

    if (right.gamesWon !== left.gamesWon) {
      return right.gamesWon - left.gamesWon;
    }

    return left.name.localeCompare(right.name, "nl");
  });
}
