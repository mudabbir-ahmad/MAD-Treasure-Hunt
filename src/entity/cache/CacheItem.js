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
    borderColor: "#45475a",
    gap: 4,
  },
  pressedItem: {
    backgroundColor: "#313244",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#cdd6f4",
    flex: 1,
    marginRight: 8,
  },
  clue: {
    fontSize: 13,
    color: "#a6adc8",
  },
  points: {
    fontSize: 12,
    fontWeight: "500",
    color: "#89b4fa",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeFound: {
    backgroundColor: "#1e3a2f",
  },
  badgeOpen: {
    backgroundColor: "#3d3117",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#cdd6f4",
  },
});

export default CacheItem;
