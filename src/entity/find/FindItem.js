import { StyleSheet, Text, View } from "react-native";

const FindItem = ({ find }) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------

  const formatDate = (dt) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleString();
  };

  const cacheName = find.FindCache?.CacheName ?? `Cache #${find.FindCacheID}`;
  const points = find.FindCache?.CachePoints ?? 0;
  const username =
    find.FindPlayer?.PlayerUser?.UserUsername ?? `Player #${find.FindPlayerID}`;

  // View --------------------------------

  return (
    <View style={styles.item}>
      <View style={styles.row}>
        <Text style={styles.cacheName} numberOfLines={1}>
          {cacheName}
        </Text>
        <Text style={styles.points}>+{points} pts</Text>
      </View>
      <Text style={styles.meta}>
        {username} · {formatDate(find.FindDatetime)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "#45475a",
    gap: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cacheName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#cdd6f4",
    flex: 1,
    marginRight: 8,
  },
  points: {
    fontSize: 14,
    fontWeight: "700",
    color: "#a6e3a1",
  },
  meta: {
    fontSize: 12,
    color: "#a6adc8",
  },
});

export default FindItem;
