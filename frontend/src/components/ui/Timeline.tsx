import type { ReactNode } from "react";
import StatusChip, { type StatusTone } from "./StatusChip";

export type TimelineItem = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  time?: ReactNode;
  meta?: ReactNode;
  tone?: StatusTone;
  badge?: ReactNode;
};

type TimelineProps = {
  items: TimelineItem[];
};

export default function Timeline({ items }: TimelineProps) {
  return (
    <div className="ui-timeline">
      {items.map((item) => (
        <article
          className={`ui-timeline-item ui-tone-${item.tone || "neutral"}`}
          key={item.id}
        >
          <div className="ui-timeline-marker" />

          <div className="ui-timeline-content">
            <div className="ui-timeline-head">
              <div>
                <p className="ui-timeline-title">{item.title}</p>
                {item.description ? (
                  <p className="ui-timeline-description">{item.description}</p>
                ) : null}
              </div>

              {item.time ? (
                <time className="ui-timeline-time">{item.time}</time>
              ) : null}
            </div>

            {item.badge || item.meta ? (
              <div className="ui-timeline-meta">
                {item.badge ? (
                  <StatusChip tone={item.tone}>{item.badge}</StatusChip>
                ) : null}
                {item.meta}
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
