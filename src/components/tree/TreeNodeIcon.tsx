"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/store";

const EMOJI_GROUPS = [
  { label: "Life", emojis: ["🌱", "🌿", "🌳", "🌍", "⭐", "✨", "🔥", "💫", "🎯", "🏆"] },
  { label: "Work", emojis: ["💼", "🚀", "💡", "🔧", "🛠️", "📊", "📈", "🎨", "💻", "🏗️"] },
  { label: "Health", emojis: ["🏃", "💪", "🧘", "🥗", "❤️", "🫀", "🧠", "💊", "🏋️", "🚴"] },
  { label: "Money", emojis: ["💰", "💵", "📈", "🏦", "💳", "🪙", "💎", "🏠", "📉", "🤑"] },
  { label: "Learn", emojis: ["📚", "🎓", "🔬", "🧪", "✏️", "📖", "🗺️", "🧩", "🔭", "🎵"] },
  { label: "People", emojis: ["🤝", "👥", "💬", "🎉", "🎁", "❤️", "🫂", "👨‍👩‍👧", "🏡", "🌸"] },
  { label: "Tasks", emojis: ["✅", "📌", "📎", "🗒️", "📋", "⚡", "🔑", "🎪", "🌐", "🎭"] },
];

function getDefaultIcon(depth: number, type: string): string {
  if (depth === 0) return "◆";
  if (type === "project") return "▸";
  return "·";
}

interface Props {
  id: string;
  icon: string | null;
  depth: number;
  type: string;
}

export function TreeNodeIcon({ id, icon, depth, type }: Props) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const updateNode = useStore((s) => s.updateNode);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function handleSelect(emoji: string) {
    updateNode(id, { icon: emoji });
    setOpen(false);
  }

  function handleClear() {
    updateNode(id, { icon: null });
    setOpen(false);
  }

  const display = icon ?? getDefaultIcon(depth, type);
  const isDefault = !icon;

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Set node icon"
        title="Set icon"
        style={{
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
          padding: 0,
          fontSize: icon ? 13 : 10,
          lineHeight: 1,
          color: isDefault ? "var(--text-muted)" : "inherit",
          transition: "background 100ms",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-node-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        {display}
      </button>

      {open && (
        <div
          ref={pickerRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 200,
            background: "var(--bg-app)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-overlay)",
            padding: 8,
            width: 220,
          }}
        >
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: 6 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 3,
                  paddingLeft: 2,
                }}
              >
                {group.label}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelect(emoji)}
                    style={{
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: icon === emoji ? "var(--accent-subtle)" : "transparent",
                      border: icon === emoji ? "1px solid var(--accent)" : "1px solid transparent",
                      borderRadius: 5,
                      cursor: "pointer",
                      fontSize: 14,
                      padding: 0,
                      transition: "background 80ms",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--bg-node-selected)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        icon === emoji ? "var(--accent-subtle)" : "transparent";
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {icon && (
            <button
              onClick={handleClear}
              style={{
                marginTop: 4,
                width: "100%",
                padding: "4px 0",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                borderRadius: 5,
                cursor: "pointer",
                fontSize: 11,
                color: "var(--text-muted)",
                fontFamily: "inherit",
              }}
            >
              Clear icon
            </button>
          )}
        </div>
      )}
    </div>
  );
}
