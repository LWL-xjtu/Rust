import type { CSSProperties, ReactNode } from "react";
import type { VisualTone } from "./StatCard";

type ProgressRingProps = {
  value: number;
  max?: number;
  label?: ReactNode;
  caption?: ReactNode;
  size?: number;
  tone?: VisualTone;
};

function clampPercent(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

export default function ProgressRing({
  value,
  max = 100,
  label,
  caption,
  size = 124,
  tone = "green",
}: ProgressRingProps) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const percent = clampPercent(value, max);
  const offset = circumference - (percent / 100) * circumference;
  const style = { "--ring-size": `${size}px` } as CSSProperties;

  return (
    <div className={`ui-progress-ring ui-tone-${tone}`} style={style}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ui-progress-ring-track" cx="60" cy="60" r={radius} />
        <circle
          className="ui-progress-ring-value"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="ui-progress-ring-center">
        <div>
          <strong>{label ?? `${Math.round(percent)}%`}</strong>
          {caption ? <span>{caption}</span> : null}
        </div>
      </div>
    </div>
  );
}
