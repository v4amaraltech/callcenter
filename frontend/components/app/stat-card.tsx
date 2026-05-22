import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StatVariant = "default" | "blue" | "orange" | "green" | "purple";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  variant?: StatVariant;
  className?: string;
};

const variantStyles: Record<
  StatVariant,
  { card: string; label: string; value: string; hint: string; icon: string }
> = {
  default: {
    card: "card-elevated bg-card",
    label: "text-muted-foreground",
    value: "text-foreground",
    hint: "text-muted-foreground",
    icon: "border-border bg-muted/60 text-primary",
  },
  blue: {
    card: "border-transparent",
    label: "",
    value: "",
    hint: "",
    icon: "border-[var(--info-text)]/20 bg-[var(--info-text)]/10",
  },
  orange: {
    card: "border-transparent",
    label: "",
    value: "",
    hint: "",
    icon: "border-[var(--warning-text)]/20 bg-[var(--warning-text)]/10",
  },
  green: {
    card: "border-transparent",
    label: "",
    value: "",
    hint: "",
    icon: "border-[var(--success-text)]/20 bg-[var(--success-text)]/10",
  },
  purple: {
    card: "border-transparent",
    label: "",
    value: "",
    hint: "",
    icon: "border-[var(--purple-text)]/20 bg-[var(--purple-text)]/10",
  },
};

const semanticBgClass: Record<Exclude<StatVariant, "default">, string> = {
  blue: "badge-info",
  orange: "badge-warning",
  green: "badge-success",
  purple: "badge-purple",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  variant = "default",
  className,
}: StatCardProps) {
  const isColored = variant !== "default";
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "relative flex items-start justify-between gap-4 overflow-hidden rounded-lg border p-5",
        isColored ? semanticBgClass[variant as Exclude<StatVariant, "default">] : styles.card,
        className,
      )}
    >
      <div className="space-y-2">
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            isColored ? "opacity-75" : styles.label,
          )}
        >
          {label}
        </p>
        <div className="space-y-1">
          <p
            className={cn(
              "text-4xl font-bold leading-none",
              !isColored && styles.value,
            )}
          >
            {value}
          </p>
          {hint ? (
            <p
              className={cn(
                "text-xs",
                isColored ? "opacity-70" : styles.hint,
              )}
            >
              {hint}
            </p>
          ) : null}
        </div>
      </div>
      {Icon ? (
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border",
            isColored ? "border-current/20 bg-current/10" : styles.icon,
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
      ) : null}
    </div>
  );
}
