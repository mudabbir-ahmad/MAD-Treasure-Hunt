import { Pressable, StyleSheet, Text, View } from "react-native";

const EventItem = ({ event, onSelect }) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------

  const handleSelect = () => {
    onSelect(event);
  };

  const formatDate = (dt) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleDateString();
  };

  // View --------------------------------

  return (
    <Pressable
      onPress={handleSelect}
      style={({ pressed }) => [styles.item, pressed && styles.pressedItem]}
    >
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>
          {event.EventName}
        </Text>
        <View
          style={[
            styles.badge,
            event.EventIspublic ? styles.badgePublic : styles.badgePrivate,
          ]}
        >
          <Text style={styles.badgeText}>
            {event.EventIspublic ? "Public" : "Private"}
          </Text>
        </View>
      </View>
      {event.EventDescription ? (
        <Text style={styles.description} numberOfLines={2}>
          {event.EventDescription}
        </Text>
      ) : null}
      <Text style={styles.meta}>
        {formatDate(event.EventStart)} — {formatDate(event.EventFinish)}
      </Text>
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
  description: {
    fontSize: 13,
    color: "#6b7280",
  },
  meta: {
    fontSize: 12,
    color: "#9ca3af",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgePublic: {
    backgroundColor: "#dcfce7",
  },
  badgePrivate: {
    backgroundColor: "#f3f4f6",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
  },
});

export default EventItem;
