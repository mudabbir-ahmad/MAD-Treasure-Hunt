import {StatusBar} from "expo-status-bar";
import {StyleSheet, View} from "react-native";
import {useNavigation, useRoute} from "@react-navigation/native";
import TopNavbar from "./TopNavbar";
import BottomNavbar from "./BottomNavbar";

const Screen = ({ children, style }) => {
  const navigation = useNavigation();
  const route = useRoute();

  const titleMap = {
    LoginScreen: "Login",
    RegisterScreen: "Register",
    GameTypeScreen: "Game Type",
    JoinPrivateGameScreen: "Join Private Game",
    ManagePrivateGameScreen: "Manage Private Game",
    CreateGameScreen: "Create Game",
    ManageGameScreen: "Manage Game",
    GameLobbyScreen: "Leaderboard",
    LeaderboardScreen: "Leaderboard",
    TeamScreen: "Current Team",
    MapScreen: "Map",
    AdminHubScreen: "Admin Hub",
    ManageSubgroupsScreen: "Manage Subgroups",
  };

  const routeName = route.name;
  const showBack = routeName !== "LoginScreen" && navigation.canGoBack();
  const pageTitle = titleMap[routeName] || "Treasure Hunt";

  return (
    <View style={[styles.screen, style]}>
      <TopNavbar title={pageTitle} showBack={showBack} navigation={navigation} />
      <View style={styles.content}>{children}</View>
      <BottomNavbar navigation={navigation} routeName={routeName} />
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
  },
});

export default Screen;

