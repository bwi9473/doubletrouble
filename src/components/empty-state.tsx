export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="ui-card-dashed rounded-3xl p-6 text-center text-sm text-app-muted">
      <p className="font-semibold text-app-foreground">{title}</p>
      <p className="mt-2">{description}</p>
    </div>
  );
}
