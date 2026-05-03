export const demoRoles = ["viewer", "admin", "match-manager"] as const;

export type DemoRole = (typeof demoRoles)[number];

export type PlayerLite = {
  id: string;
  name: string;
  rankingLabel?: string | null;
  rankingValue?: number | null;
  photoUrl?: string | null;
};

export type Team = {
  player1: PlayerLite;
  player2: PlayerLite;
};

export type GeneratedMatch = {
  id: string;
  team1: Team;
  team2: Team;
};

export type RankingEntry = PlayerLite & {
  points: number;
  gamesWon: number;
  gamesLost: number;
  gameDifference: number;
  matchesPlayed: number;
};
