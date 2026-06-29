import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export default function EmptyState({
  icon,
  title,
  description,
  actions,
}: EmptyStateProps) {
  return (
    <div className="ui-empty-state">
      <div className="ui-empty-state-inner">
        {icon ? <div className="ui-empty-state-icon">{icon}</div> : null}
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
        {actions ? <div className="ui-empty-state-actions">{actions}</div> : null}
      </div>
    </div>
  );
}
