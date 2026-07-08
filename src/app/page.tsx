"use client";

import dynamic from "next/dynamic";

// ssr: false prevents hydration mismatch — this app is entirely localStorage-driven
const AppShell = dynamic(
  () => import("@/components/layout/AppShell").then((m) => m.AppShell),
  { ssr: false, loading: () => null }
);

export default function Home() {
  return <AppShell />;
}
