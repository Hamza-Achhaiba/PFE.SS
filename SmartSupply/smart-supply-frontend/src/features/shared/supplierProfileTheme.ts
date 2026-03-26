import type { CSSProperties } from "react";

export const supplierProfileChartTheme = {
  grid: "rgba(148, 163, 184, 0.14)",
  tick: "#94a3b8",
  cursor: "rgba(148, 163, 184, 0.08)",
  tooltipContentStyle: {
    borderRadius: "16px",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    boxShadow: "0 18px 40px rgba(2, 6, 23, 0.45)",
    padding: "12px 16px",
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    color: "#e2e8f0",
  } satisfies CSSProperties,
  tooltipLabelStyle: {
    color: "#f8fafc",
    fontWeight: 700,
  } satisfies CSSProperties,
  tooltipItemStyle: {
    color: "#e2e8f0",
  } satisfies CSSProperties,
};
