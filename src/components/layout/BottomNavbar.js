import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clearGameSession, getSession } from "../../hooks/SessionStore";
import API, { API_BASE_URL } from "../API/API";

const BottomNavbar = ({ navigation, routeName }) => {
  //   Initialisation ------------

  const insets = useSafeAreaInsets();
  const session = getSession();

  const adminTabs = [
    {
      label: "Settings",
      route: "GameSettingsScreen",
      onPress: () => navigation.navigate("GameSettingsScreen"),
    },
    {
      label: "Map",
      route: "MapScreen",
      onPress: () => navigation.navigate("MapScreen"),
    },
    {
      label: "Players",
      route: "PlayersScreen",
      onPress: () => navigation.navigate("PlayersScreen"),
    },
    {
      label: "Leaderboard",
      route: "LeaderboardScreen",
      onPress: () => navigation.navigate("LeaderboardScreen"),
    },
    {
      label: "Games",
      route: "GameSelectionScreen",
      onPress: () => navigation.navigate("GameSelectionScreen"),
    },
    {
      label: "Global",
      route: "GlobalEventsScreen",
      onPress: () => navigation.navigate("GlobalEventsScreen"),
    },
  ];

  const playerTabs = [
    {
      label: "Team",
      route: "TeamScreen",
      onPress: () => navigation.navigate("TeamScreen"),
    },
    {
      label: "Map",
      route: "MapScreen",
      onPress: () => navigation.navigate("MapScreen"),
    },
    {
      label: "Leaderboard",
      route: "LeaderboardScreen",
      onPress: () => navigation.navigate("LeaderboardScreen"),
    },
    {
      label: "Games",
      route: "GameSelectionScreen",
      onPress: () => navigation.navigate("GameSelectionScreen"),
    },
    {
      label: "Global",
      route: "GlobalEventsScreen",
      onPress: () => navigation.navigate("GlobalEventsScreen"),
    },

    { label: "Leave", route: "__leave__", onPress: () => handleLeaveGame() },
  ];

  const tabs = session.isAcceptedAdmin ? adminTabs : playerTabs;

  //   State ----------------------
  //   Handlers -------------------

  const handleLeaveGame = () => {
    Alert.alert("Leave Game", "Are you sure you want to leave this game?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          const s = getSession();
          const endpoint = `${API_BASE_URL}/subgroup-memberships?Uid=${s.currentUid}&Gid=${s.currentGid}`;
          const res = await API.get(endpoint);
          if (res.isSuccess && res.result.length > 0) {
            await API.delete(
              `${API_BASE_URL}/subgroup-memberships/${res.result[0].id}`,
            );
          }
          clearGameSession();
          navigation.reset({ index: 0, routes: [{ name: "Game" }] });
        },
      },
    ]);
  };

  //   View -----------------------

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {tabs.map((tab) => {
        const isActive = routeName === tab.route;
        const isLeave = tab.route === "__leave__";
        return (
          <Pressable
            key={tab.label}
            onPress={tab.onPress}
            style={[
              styles.tab,
              isActive && styles.tabActive,
              isLeave && styles.tabLeave,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                isActive && styles.tabTextActive,
                isLeave && styles.tabTextLeave,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    borderTopWidth: 1,
    borderTopColor: "#555555",
    backgroundColor: "#4a4a4a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: "#5c5c5c",
  },
  tabLeave: {
    backgroundColor: "rgba(220,38,38,0.15)",
  },
  tabText: {
    color: "#d1d5db",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  tabTextLeave: {
    color: "#fca5a5",
  },
});

export default BottomNavbar;
