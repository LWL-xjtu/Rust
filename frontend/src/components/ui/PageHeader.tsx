import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
}: PageHeaderProps) {
  return (
    <header className="ui-page-header">
      <div className="ui-page-header-main">
        {eyebrow ? <p className="ui-page-header-eyebrow">{eyebrow}</p> : null}

        <div className="ui-page-header-title-row">
          <h1>{title}</h1>
          {meta ? <div className="ui-page-header-meta">{meta}</div> : null}
        </div>

        {description ? (
          <p className="ui-page-header-description">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="ui-page-header-actions">{actions}</div> : null}
    </header>
  );
}
