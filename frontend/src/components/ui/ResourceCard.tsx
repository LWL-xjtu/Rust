import type { ReactNode } from "react";
import type { VisualTone } from "./StatCard";

type ResourceCardProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  tone?: VisualTone;
};

export default function ResourceCard({
  title,
  description,
  icon,
  meta,
  children,
  footer,
  tone = "blue",
}: ResourceCardProps) {
  return (
    <article className={`ui-resource-card ui-tone-${tone}`}>
      <div className="ui-resource-card-head">
        <div>
          <h3 className="ui-resource-card-title">{title}</h3>
          {description ? (
            <p className="ui-resource-card-description">{description}</p>
          ) : null}
        </div>

        {icon ? <div className="ui-resource-card-icon">{icon}</div> : null}
      </div>

      {meta ? <div className="ui-resource-card-meta">{meta}</div> : null}
      {children ? <div className="ui-resource-card-body">{children}</div> : null}
      {footer ? <div className="ui-resource-card-footer">{footer}</div> : null}
    </article>
  );
}
