import {StatusBar} from "expo-status-bar";
import {StyleSheet, View} from "react-native";
import {useNavigation, useRoute} from "@react-navigation/native";
import {useSafeAreaInsets} from "react-native-safe-area-context";
import TopNavbar from "./TopNavbar";
import BottomNavbar from "./BottomNavbar";

const Screen = ({ children, style, showBack = false }) => {
  //   Initialisation -------------

  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const titleMap = {
    LeaderboardScreen: "Leaderboard",
    TeamScreen: "Current Team",
    MapScreen: "Map",
    GameSettingsScreen: "Game Settings",
    PlayersScreen: "Players",
    ExpandedMapScreen: "Map View",
  };

  //   State ----------------------

  const routeName = route.name;
  const isAuthScreen = routeName === "LoginScreen" || routeName === "RegisterScreen";
  const pageTitle = titleMap[routeName] || "Treasure Hunt";

  //   Handlers -------------------
  //   View -----------------------

  return (
    <View style={[styles.screen, isAuthScreen && {paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      {!isAuthScreen && <TopNavbar title={pageTitle} showBack={showBack} navigation={navigation} />}
      <View style={[styles.content, style]}>{children}</View>
      {!isAuthScreen && <BottomNavbar navigation={navigation} routeName={routeName} />}
      <StatusBar style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 15,
    zIndex: 1,
    overflow: "hidden",
  },
});

export default Screen;

