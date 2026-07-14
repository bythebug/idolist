import { createSeedData } from "@idolist/core";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

// Phase 36 smoke test: proves @idolist/core resolves through Metro.
// Replaced by the real store + tree in Phases 37–40.
export default function Index() {
  const nodeCount = useMemo(() => {
    const seed = createSeedData();
    return Object.keys(seed.nodes).length;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>idolist</Text>
      <Text style={styles.subtitle}>
        @idolist/core loaded — {nodeCount} seed nodes
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
});
