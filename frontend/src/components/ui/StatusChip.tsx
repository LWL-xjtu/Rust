import type { ReactNode } from "react";

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "admin"
  | "teacher"
  | "student";

type StatusChipProps = {
  children: ReactNode;
  tone?: StatusTone;
};

export default function StatusChip({
  children,
  tone = "neutral",
}: StatusChipProps) {
  return (
    <span className={`ui-status-chip ui-status-chip-${tone}`}>{children}</span>
  );
}
