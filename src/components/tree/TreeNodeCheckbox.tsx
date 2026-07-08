"use client";

import { motion } from "framer-motion";

interface Props {
  completed: boolean;
  onToggle: () => void;
}

export function TreeNodeCheckbox({ completed, onToggle }: Props) {
  return (
    <motion.button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={completed ? "Mark incomplete" : "Mark complete"}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.85 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{
        flexShrink: 0,
        width: 18,
        height: 18,
        borderRadius: 5,
        border: `1.5px solid ${completed ? "var(--success)" : "var(--border)"}`,
        background: completed ? "var(--success)" : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        transition: "border-color 150ms, background 150ms",
      }}
    >
      <motion.svg
        width="10"
        height="8"
        viewBox="0 0 10 8"
        initial={false}
        animate={completed ? "visible" : "hidden"}
      >
        <motion.path
          d="M1 4 L3.5 6.5 L9 1"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{
            hidden: { pathLength: 0, opacity: 0 },
            visible: { pathLength: 1, opacity: 1 },
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </motion.svg>
    </motion.button>
  );
}
