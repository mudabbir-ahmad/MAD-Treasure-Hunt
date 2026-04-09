import {useEffect} from "react";
import {StyleSheet, Text, View} from "react-native";
import Screen from "../../layout/Screen";
import {Button, ButtonTray} from "../../UI/Button";
import Card from "../../UI/Card";
import {getSession} from "../../../hooks/SessionStore";
import {GAME_MODE} from "../../../utils/gameConstants";

const GlobalCacheViewScreen = ({ navigation, route }) => {
  // Initialisations ---------------------

  const { cache, isFound: initIsFound } = route.params;
  const session = getSession();

  // Handlers ----------------------------

  useEffect(() => {
    if (session.isBusiness || session.currentGameMode !== GAME_MODE.GLOBAL) {
      navigation.replace("MapScreen");
    }
  }, [navigation, session.currentGameMode, session.isBusiness]);

  const handleBackToMap = () => {
    navigation.navigate("GlobalMapScreen", {
      eventId: cache.CacheEventID ?? session.currentGlobalEventId,
      event: route.params?.event ?? null,
      cache,
      selectedCacheId: cache.CacheID,
    });
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
              initIsFound ? styles.badgeFound : styles.badgeOpen,
            ]}
          >
            <Text style={styles.statusText}>
              {initIsFound ? "Already Found" : "Not Yet Found"}
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

          {!initIsFound ? (
            <Text style={styles.claimHint}>
              Claim this cache from the Global Map while within 30m and facing
              it.
            </Text>
          ) : null}
        </Card>

        <ButtonTray>
          <Button label="Back to Map" onClick={handleBackToMap} />
        </ButtonTray>
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
    color: "#cdd6f4",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeFound: {
    backgroundColor: "#1e3a2f",
  },
  badgeOpen: {
    backgroundColor: "#3d3117",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#cdd6f4",
  },
  detailRow: {
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#a6adc8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: "#cdd6f4",
  },
  claimHint: {
    marginTop: 6,
    color: "#89b4fa",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default GlobalCacheViewScreen;
