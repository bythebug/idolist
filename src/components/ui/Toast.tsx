"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store";
import { useShallow } from "zustand/react/shallow";

export function Toast() {
  const { toast, dismissToast } = useStore(
    useShallow((s) => ({ toast: s.toast, dismissToast: s.dismissToast }))
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, 2500);
    return () => clearTimeout(timer);
  }, [toast?.id, dismissToast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            x: "-50%",
            background: "var(--text-primary)",
            color: "var(--bg-app)",
            padding: "8px 16px",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: "var(--shadow-overlay)",
            zIndex: 300,
            whiteSpace: "nowrap",
            fontFamily: "inherit",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
