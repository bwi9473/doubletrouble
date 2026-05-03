type DashboardStatsProps = {
  stats: {
    personCount: number;
    activePoolCount: number;
    archivedPoolCount: number;
    totalMatches: number;
    scoredMatches: number;
  };
};

const labels: Array<{ key: keyof DashboardStatsProps["stats"]; title: string; helper: string }> = [
  { key: "personCount", title: "Spelers", helper: "Totaal beschikbare spelers" },
  { key: "activePoolCount", title: "Actieve poules", helper: "Inclusief afgeronde poules" },
  { key: "archivedPoolCount", title: "Archief", helper: "Bewaar vorige competities" },
  { key: "totalMatches", title: "Wedstrijden", helper: "Automatisch gegenereerde dubbelwedstrijden" },
  { key: "scoredMatches", title: "Resultaten", helper: "Wedstrijden met ingevoerde score" },
];

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {labels.map((item) => (
        <article key={item.key} className="ui-card rounded-3xl p-4">
          <p className="text-sm text-app-muted">{item.title}</p>
          <p className="mt-2 text-3xl font-semibold text-app-foreground">{stats[item.key]}</p>
          <p className="mt-2 text-xs text-app-muted">{item.helper}</p>
        </article>
      ))}
    </div>
  );
}
