import type { PropsWithChildren } from "react";

export function StatusPill({ tone, children }: PropsWithChildren<{ tone: "ok" | "warning" | "danger" }>) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}
