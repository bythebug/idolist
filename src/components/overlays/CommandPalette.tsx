"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Fuse from "fuse.js";
import { Search } from "lucide-react";
import { useStore } from "@/store";
import { selectSearchIndex } from "@/store/selectors";
import type { SearchResult } from "@/types";

export function CommandPalette() {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { nodes, rootIds, collapsedIds, closeCommandPalette, setFocused, setSelected, expandAll } =
    useStore((s) => ({
      nodes: s.nodes,
      rootIds: s.rootIds,
      collapsedIds: s.collapsedIds,
      closeCommandPalette: s.closeCommandPalette,
      setFocused: s.setFocused,
      setSelected: s.setSelected,
      expandAll: s.expandAll,
    }));

  const searchIndex = selectSearchIndex(nodes);
  const fuse = new Fuse(searchIndex, {
    keys: ["title", "path"],
    threshold: 0.4,
    includeMatches: true,
  });

  const results: SearchResult[] =
    query.trim() === ""
      ? searchIndex.slice(0, 8)
      : fuse.search(query).map((r) => r.item).slice(0, 8);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function selectResult(result: SearchResult) {
    setFocused(result.id);
    setSelected(result.id);
    // Expand parents so the node is visible
    expandAll();
    closeCommandPalette();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      closeCommandPalette();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && results[activeIndex]) {
      selectResult(results[activeIndex]);
      return;
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCommandPalette}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 520,
          maxWidth: "calc(100vw - 32px)",
          background: "var(--bg-app)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-overlay)",
          zIndex: 101,
          overflow: "hidden",
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search everything..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 15,
              color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 2,
                fontSize: 12,
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflow: "auto" }}>
          {results.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((result, i) => (
              <button
                key={result.id}
                onClick={() => selectResult(result)}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  padding: "10px 16px",
                  background: i === activeIndex ? "var(--bg-node-selected)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--text-primary)",
                    fontWeight: 500,
                  }}
                >
                  {result.title || "Untitled"}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  {result.path.slice(0, -1).join(" › ")}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            gap: 16,
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </>
  );
}
