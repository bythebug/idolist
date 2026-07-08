"use client";

import { useEffect } from "react";
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

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
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
    </div>
  );
}
