import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import Screen from "../../layout/Screen";
import { Button, ButtonTray } from "../../UI/Button";
import Card from "../../UI/Card";
import useGlobalHook from "../../../hooks/useGlobalHook";
import { getSession } from "../../../hooks/SessionStore";

const GlobalCacheViewScreen = ({ navigation, route }) => {
  // Initialisations ---------------------

  const { cache, isFound: initIsFound, onFindLogged } = route.params;
  const { logFind } = useGlobalHook();
  const session = getSession();

  // State -------------------------------

  const [isFound, setIsFound] = useState(initIsFound);
  const [isLogging, setIsLogging] = useState(false);

  // Handlers ----------------------------

  const handleLogFind = async () => {
    if (!session.currentGlobalPlayerId) {
      Alert.alert(
        "Not joined",
        "You must join the event before logging a find.",
      );
      return;
    }

    Alert.alert(
      "Log Discovery",
      `Record that you found "${cache.CacheName}" and earn ${cache.CachePoints ?? 0} points?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Find",
          onPress: async () => {
            setIsLogging(true);
            const result = await logFind({
              FindPlayerID: session.currentGlobalPlayerId,
              FindCacheID: cache.CacheID,
              FindDatetime: new Date().toISOString(),
            });
            setIsLogging(false);
            if (result) {
              setIsFound(true);
              if (onFindLogged) onFindLogged();
              Alert.alert(
                "Discovery logged!",
                `+${cache.CachePoints ?? 0} points earned.`,
              );
            } else {
              Alert.alert("Error", "Could not log find. Please try again.");
            }
          },
        },
      ],
    );
  };

  // View --------------------------------

  return (
    <Screen showBack>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.title}>{cache.CacheName}</Text>

          <View
            style={[
              styles.statusBadge,
              isFound ? styles.badgeFound : styles.badgeOpen,
            ]}
          >
            <Text style={styles.statusText}>
              {isFound ? "Already Found" : "Not Yet Found"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Points</Text>
            <Text style={styles.value}>{cache.CachePoints ?? 0}</Text>
          </View>

          {cache.CacheDescription ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.value}>{cache.CacheDescription}</Text>
            </View>
          ) : null}

          {cache.CacheClue ? (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Clue</Text>
              <Text style={styles.value}>{cache.CacheClue}</Text>
            </View>
          ) : null}
        </Card>

        {isLogging ? (
          <ActivityIndicator size="large" />
        ) : (
          <ButtonTray>
            {!isFound && (
              <Button
                label="Log Discovery"
                onClick={handleLogFind}
                styleButton={styles.logButton}
                styleLabel={styles.logButtonLabel}
              />
            )}
            <Button label="Back" onClick={() => navigation.goBack()} />
          </ButtonTray>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  card: {
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeFound: {
    backgroundColor: "#d1fae5",
  },
  badgeOpen: {
    backgroundColor: "#fef3c7",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  detailRow: {
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: "#111827",
  },
  logButton: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
    flex: 2,
  },
  logButtonLabel: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default GlobalCacheViewScreen;
