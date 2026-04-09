import { Pressable, StyleSheet, Text, View } from "react-native";

const CacheItem = ({ cache, isFound, onSelect }) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------

  const handleSelect = () => {
    onSelect(cache);
  };

  // View --------------------------------

  return (
    <Pressable
      onPress={handleSelect}
      style={({ pressed }) => [styles.item, pressed && styles.pressedItem]}
    >
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>
          {cache.CacheName}
        </Text>
        <View
          style={[styles.badge, isFound ? styles.badgeFound : styles.badgeOpen]}
        >
          <Text style={styles.badgeText}>{isFound ? "Found" : "Open"}</Text>
        </View>
      </View>
      {cache.CacheClue ? (
        <Text style={styles.clue} numberOfLines={2}>
          {cache.CacheClue}
        </Text>
      ) : null}
      <Text style={styles.points}>Points: {cache.CachePoints ?? 0}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  item: {
    paddingVertical: 14,
    paddingHorizontal: 2,
    borderTopWidth: 1,
    borderColor: "lightgray",
    gap: 4,
  },
  pressedItem: {
    backgroundColor: "#f0f9ff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  clue: {
    fontSize: 13,
    color: "#6b7280",
  },
  points: {
    fontSize: 12,
    fontWeight: "500",
    color: "#2563eb",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeFound: {
    backgroundColor: "#d1fae5",
  },
  badgeOpen: {
    backgroundColor: "#fef3c7",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
  },
});

export default CacheItem;
