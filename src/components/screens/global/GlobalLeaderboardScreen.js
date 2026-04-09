import {useCallback, useEffect, useState} from "react";
import {ActivityIndicator, ScrollView, StyleSheet, Text, View,} from "react-native";
import Screen from "../../layout/Screen";
import {Button, ButtonTray} from "../../UI/Button";
import Card from "../../UI/Card";
import FindList from "../../../entity/find/FindList";
import useGlobalHook from "../../../hooks/useGlobalHook";
import {getSession} from "../../../hooks/SessionStore";
import {GAME_MODE} from "../../../utils/gameConstants";

const GlobalLeaderboardScreen = ({ navigation, route }) => {
  // Initialisations ---------------------

  const eventId = route?.params?.eventId ?? getSession().currentGlobalEventId;
  const { getFindsByEvent, getCachesByEvent, getPlayersByEvent } =
    useGlobalHook();
  const session = getSession();

  // State -------------------------------

  const [isLoading, setIsLoading] = useState(true);
  const [rankings, setRankings] = useState([]);
  const [recentFinds, setRecentFinds] = useState([]);
  const [activeTab, setActiveTab] = useState("rankings");

  // Handlers ----------------------------

  const loadData = useCallback(async () => {
    setIsLoading(true);

    const [finds, caches, players] = await Promise.all([
      getFindsByEvent(eventId),
      getCachesByEvent(eventId),
      getPlayersByEvent(eventId),
    ]);

    // Build cache points lookup
    const cacheMap = {};
    (caches || []).forEach((c) => {
      cacheMap[c.CacheID] = c;
    });

    // Augment finds with cache info for FindList
    const augmented = (finds || []).map((f) => ({
      ...f,
      FindCache: f.FindCache || cacheMap[f.FindCacheID] || null,
    }));

    // Sort recent first
    const sorted = [...augmented].sort(
      (a, b) => new Date(b.FindDatetime) - new Date(a.FindDatetime),
    );
    setRecentFinds(sorted.slice(0, 50));

    // Aggregate points per player
    const pointsMap = {};
    augmented.forEach((f) => {
      const pid = f.FindPlayerID;
      const pts = f.FindCache?.CachePoints ?? 0;
      if (!pointsMap[pid])
        pointsMap[pid] = { playerId: pid, points: 0, finds: 0, name: null };
      pointsMap[pid].points += pts;
      pointsMap[pid].finds += 1;
    });

    // Attach usernames from players list
    (players || []).forEach((p) => {
      if (pointsMap[p.PlayerID]) {
        pointsMap[p.PlayerID].name =
          p.PlayerUser?.UserUsername || `Player #${p.PlayerUserID}`;
      }
    });

    const ranked = Object.values(pointsMap).sort((a, b) => b.points - a.points);
    setRankings(ranked);
    setIsLoading(false);
  }, [eventId, getFindsByEvent, getCachesByEvent, getPlayersByEvent]);

  useEffect(() => {
    if (session.isBusiness || session.currentGameMode !== GAME_MODE.GLOBAL) {
      navigation.replace("MapScreen");
      return;
    }
    if (!eventId) {
      navigation.replace("GlobalEventsScreen");
      return;
    }
    loadData();
  }, [eventId, loadData, navigation, session.currentGameMode, session.isBusiness]);

  // View --------------------------------

  if (isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  return (
    <Screen showBack>
      <View style={styles.container}>
        <View style={styles.tabs}>
          <TabButton
            label="Rankings"
            active={activeTab === "rankings"}
            onPress={() => setActiveTab("rankings")}
          />
          <TabButton
            label="Recent Finds"
            active={activeTab === "recentFinds"}
            onPress={() => setActiveTab("recentFinds")}
          />
        </View>

        {activeTab === "rankings" ? (
          <ScrollView contentContainerStyle={styles.rankList}>
            {rankings.length === 0 ? (
              <Text style={styles.empty}>No finds recorded yet.</Text>
            ) : (
              rankings.map((entry, index) => {
                const isCurrent =
                  entry.playerId === session.currentGlobalPlayerId;
                return (
                  <Card
                    key={entry.playerId}
                    style={[styles.rankCard, isCurrent && styles.myCard]}
                  >
                    <View style={styles.rankRow}>
                      <Text style={styles.rankPos}>#{index + 1}</Text>
                      <Text style={styles.rankName} numberOfLines={1}>
                        {entry.name || `Player #${entry.playerId}`}
                        {isCurrent ? "  (you)" : ""}
                      </Text>
                      <View style={styles.rankRight}>
                        <Text style={styles.rankPoints}>
                          {entry.points} pts
                        </Text>
                        <Text style={styles.rankFinds}>
                          {entry.finds} finds
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </ScrollView>
        ) : recentFinds.length === 0 ? (
          <Text style={styles.empty}>No finds recorded yet.</Text>
        ) : (
          <FindList finds={recentFinds} />
        )}

        <ButtonTray>
          <Button label="Refresh" onClick={loadData} />
        </ButtonTray>
      </View>
    </Screen>
  );
};

const TabButton = ({ label, active, onPress }) => (
  <Text
    onPress={onPress}
    style={[tabStyles.tab, active && tabStyles.activeTab]}
  >
    {label}
  </Text>
);

const tabStyles = StyleSheet.create({
  tab: {
    flex: 1,
    textAlign: "center",
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    color: "#111827",
    borderBottomColor: "#111827",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  rankList: {
    gap: 6,
    paddingBottom: 8,
  },
  rankCard: {
    marginBottom: 0,
  },
  myCard: {
    borderColor: "#2563eb",
    borderWidth: 2,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rankPos: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6b7280",
    width: 32,
  },
  rankName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  rankRight: {
    alignItems: "flex-end",
  },
  rankPoints: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16a34a",
  },
  rankFinds: {
    fontSize: 12,
    color: "#9ca3af",
  },
  empty: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 30,
    fontSize: 15,
  },
});

export default GlobalLeaderboardScreen;
