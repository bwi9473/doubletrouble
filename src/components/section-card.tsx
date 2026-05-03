import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("ui-card rounded-3xl p-4 sm:p-6", className)}>
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-app-foreground">{title}</h2>
        {description ? <p className="text-sm text-app-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
