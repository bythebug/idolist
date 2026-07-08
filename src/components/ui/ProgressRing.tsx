"use client";

import { motion } from "framer-motion";

interface Props {
  value: number; // 0–1
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({ value, size = 40, strokeWidth = 3 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, value));

  const color =
    pct >= 0.8
      ? "var(--success)"
      : pct >= 0.4
      ? "var(--warning)"
      : "var(--border)";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset: circumference * (1 - pct) }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}
