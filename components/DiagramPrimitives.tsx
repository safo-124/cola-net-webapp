"use client";

/* ─────────────────────────────────────────────────────────────────────
   Reusable diagram primitives used across all presentation slides.
   ───────────────────────────────────────────────────────────────────── */
import React from "react";

/* ── Arrow glyphs ─────────────────────────────────────────────────── */
export const ArrowRight = () => (
  <span className="diagram-arrow select-none">→</span>
);
export const ArrowDown = () => (
  <span className="diagram-arrow select-none">↓</span>
);
export const ArrowBi = () => (
  <span className="diagram-arrow select-none">⇄</span>
);
export const Plus = () => (
  <span className="diagram-arrow select-none text-xl">+</span>
);

/* ── Box ──────────────────────────────────────────────────────────── */
type BoxColor =
  | "accent"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "orange"
  | "cyan"
  | "default";

export function Box({
  children,
  color = "default",
  className = "",
  small = false,
}: {
  children: React.ReactNode;
  color?: BoxColor;
  className?: string;
  small?: boolean;
}) {
  const cls =
    color === "default" ? "diagram-box" : `diagram-box diagram-box-${color}`;
  return (
    <div className={`${cls} ${small ? "text-[10px] px-2 py-1.5" : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ── Flow row (horizontal with arrows) ────────────────────────────── */
export function FlowRow({
  children,
  gap = "gap-3",
}: {
  children: React.ReactNode;
  gap?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-center ${gap}`}>
      {children}
    </div>
  );
}

/* ── Flow column ──────────────────────────────────────────────────── */
export function FlowCol({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">{children}</div>
  );
}

/* ── Labeled section in a diagram ─────────────────────────────────── */
export function DiagramSection({
  label,
  labelColor = "accent",
  children,
}: {
  label: string;
  labelColor?: BoxColor;
  children: React.ReactNode;
}) {
  const colorMap: Record<BoxColor, string> = {
    accent: "var(--accent)",
    green: "var(--green)",
    red: "var(--red)",
    yellow: "var(--yellow)",
    purple: "var(--purple)",
    orange: "var(--orange)",
    cyan: "var(--cyan)",
    default: "var(--border)",
  };
  const textColorMap: Record<BoxColor, string> = {
    accent: "var(--highlight-blue)",
    green: "var(--highlight-green)",
    red: "var(--highlight-red)",
    yellow: "var(--highlight-yellow)",
    purple: "var(--purple)",
    orange: "var(--highlight-orange)",
    cyan: "var(--cyan)",
    default: "var(--text-muted)",
  };
  return (
    <div
      className="rounded-xl border-2 border-dashed p-4"
      style={{ borderColor: `color-mix(in srgb, ${colorMap[labelColor]} 30%, transparent)` }}
    >
      <div
        className="text-xs font-bold uppercase tracking-wider mb-3"
        style={{ color: textColorMap[labelColor] }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

/* ── Comparison (before / after) ──────────────────────────────────── */
export function BeforeAfter({
  before,
  after,
}: {
  before: React.ReactNode;
  after: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div className="space-y-2">
        <span className="weakness-tag">Problem</span>
        <div className="mt-2">{before}</div>
      </div>
      <div className="space-y-2">
        <span className="fix-tag">Solution</span>
        <div className="mt-2">{after}</div>
      </div>
    </div>
  );
}
