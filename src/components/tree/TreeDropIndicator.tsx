"use client";

interface Props {
  depth: number;
  position: "top" | "bottom";
}

const INDENT = 20;
const CHECKBOX_OFFSET = 28; // collapse-toggle (16) + gap (4) + checkbox-ish (8)

export function TreeDropIndicator({ depth, position }: Props) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: depth * INDENT + 8 + CHECKBOX_OFFSET,
        right: 8,
        [position === "top" ? "top" : "bottom"]: -1,
        height: 2,
        background: "var(--accent)",
        borderRadius: 1,
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -4,
          top: -3,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--accent)",
        }}
      />
    </div>
  );
}
