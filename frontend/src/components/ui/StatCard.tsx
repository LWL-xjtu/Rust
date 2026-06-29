import type { ReactNode } from "react";

export type VisualTone =
  | "blue"
  | "cyan"
  | "green"
  | "amber"
  | "rose"
  | "violet"
  | "neutral";

type StatCardProps = {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  tone?: VisualTone;
};

export default function StatCard({
  label,
  value,
  description,
  icon,
  footer,
  tone = "cyan",
}: StatCardProps) {
  return (
    <article className={`ui-stat-card ui-tone-${tone}`}>
      <div className="ui-stat-card-top">
        <p className="ui-stat-card-label">{label}</p>
        {icon ? <div className="ui-stat-card-icon">{icon}</div> : null}
      </div>

      <strong className="ui-stat-card-value">{value}</strong>

      {description ? (
        <p className="ui-stat-card-description">{description}</p>
      ) : null}

      {footer ? <div className="ui-stat-card-footer">{footer}</div> : null}
    </article>
  );
}
