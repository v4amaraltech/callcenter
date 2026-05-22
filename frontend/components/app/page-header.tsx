import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-3 pb-1 xl:flex-row xl:items-end xl:justify-between", className)}>
      <div className="space-y-1.5">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{eyebrow}</p>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold leading-none tracking-tight text-foreground lg:text-3xl">{title}</h1>
          {description ? (
            <p className="max-w-3xl text-sm text-muted-foreground leading-normal">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-3 xl:justify-end">{actions}</div>
      ) : null}
    </header>
  );
}
