import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoginScreen from "./src/components/screens/LoginScreen";
import RegisterScreen from "./src/components/screens/RegisterScreen";
import TeamScreen from "./src/components/screens/TeamScreen";
import MapScreen from "./src/components/screens/MapScreen";
import LeaderboardScreen from "./src/components/screens/LeaderboardScreen";
import GameSettingsScreen from "./src/components/screens/GameSettingsScreen";
import DepartmentSettingsScreen from "./src/components/screens/DepartmentSettingsScreen";
import PlayersScreen from "./src/components/screens/PlayersScreen";
import ExpandedMapScreen from "./src/components/screens/ExpandedMapScreen";
import GameSelectionScreen from "./src/components/screens/GameSelectionScreen";
import GlobalEventsScreen from "./src/components/screens/global/GlobalEventsScreen";
import GlobalMapScreen from "./src/components/screens/global/GlobalMapScreen";
import GlobalCacheViewScreen from "./src/components/screens/global/GlobalCacheViewScreen";
import GlobalLeaderboardScreen from "./src/components/screens/global/GlobalLeaderboardScreen";
import { loadSession } from "./src/hooks/SessionStore";

const RootStack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const GameStackNav = createNativeStackNavigator();
const AdminStackNav = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: "#ffffff" },
};

const AuthStack = () => (
  <AuthStackNav.Navigator
    screenOptions={{ ...screenOptions, keyboardHandlingEnabled: false }}
  >
    <AuthStackNav.Screen name="LoginScreen" component={LoginScreen} />
    <AuthStackNav.Screen name="RegisterScreen" component={RegisterScreen} />
  </AuthStackNav.Navigator>
);

const GameStack = () => (
  <GameStackNav.Navigator screenOptions={screenOptions}>
    <GameStackNav.Screen
      name="GameSelectionScreen"
      component={GameSelectionScreen}
    />
    <GameStackNav.Screen name="MapScreen" component={MapScreen} />
    <GameStackNav.Screen name="TeamScreen" component={TeamScreen} />
    <GameStackNav.Screen
      name="LeaderboardScreen"
      component={LeaderboardScreen}
    />
    <GameStackNav.Screen name="PlayersScreen" component={PlayersScreen} />
    <GameStackNav.Screen
      name="ExpandedMapScreen"
      component={ExpandedMapScreen}
    />
    <GameStackNav.Screen
      name="GlobalEventsScreen"
      component={GlobalEventsScreen}
    />
    <GameStackNav.Screen name="GlobalMapScreen" component={GlobalMapScreen} />
    <GameStackNav.Screen
      name="GlobalCacheViewScreen"
      component={GlobalCacheViewScreen}
    />
    <GameStackNav.Screen
      name="GlobalLeaderboardScreen"
      component={GlobalLeaderboardScreen}
    />
  </GameStackNav.Navigator>
);

const AdminStack = () => (
  <AdminStackNav.Navigator screenOptions={screenOptions}>
    <AdminStackNav.Screen
      name="GameSelectionScreen"
      component={GameSelectionScreen}
    />
    <AdminStackNav.Screen
      name="GameSettingsScreen"
      component={GameSettingsScreen}
    />
    <AdminStackNav.Screen name="MapScreen" component={MapScreen} />
    <AdminStackNav.Screen
      name="LeaderboardScreen"
      component={LeaderboardScreen}
    />
    <AdminStackNav.Screen name="PlayersScreen" component={PlayersScreen} />
    <AdminStackNav.Screen
      name="ExpandedMapScreen"
      component={ExpandedMapScreen}
    />
    <AdminStackNav.Screen name="TeamScreen" component={TeamScreen} />
    <AdminStackNav.Screen
      name="GlobalEventsScreen"
      component={GlobalEventsScreen}
    />
    <AdminStackNav.Screen name="GlobalMapScreen" component={GlobalMapScreen} />
    <AdminStackNav.Screen
      name="GlobalCacheViewScreen"
      component={GlobalCacheViewScreen}
    />
    <AdminStackNav.Screen
      name="GlobalLeaderboardScreen"
      component={GlobalLeaderboardScreen}
    />
  </AdminStackNav.Navigator>
    <AdminStackNav.Navigator screenOptions={screenOptions}>
        <AdminStackNav.Screen name="GameSettingsScreen" component={GameSettingsScreen}/>
        <AdminStackNav.Screen name="DepartmentSettingsScreen" component={DepartmentSettingsScreen}/>
        <AdminStackNav.Screen name="MapScreen" component={MapScreen}/>
        <AdminStackNav.Screen name="LeaderboardScreen" component={LeaderboardScreen}/>
        <AdminStackNav.Screen name="PlayersScreen" component={PlayersScreen}/>
        <AdminStackNav.Screen name="ExpandedMapScreen" component={ExpandedMapScreen}/>
        <AdminStackNav.Screen name="TeamScreen" component={TeamScreen}/>
    </AdminStackNav.Navigator>
);

export const App = () => {
  // Load persisted session from AsyncStorage before choosing initial route
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Auth");

  useEffect(() => {
    loadSession().then((session) => {
      if (session.currentUid) {
        setInitialRoute(session.isAcceptedAdmin ? "Admin" : "Game");
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootStack.Navigator
          initialRouteName={initialRoute}
          screenOptions={screenOptions}
        >
          <RootStack.Screen name="Auth" component={AuthStack} />
          <RootStack.Screen name="Game" component={GameStack} />
          <RootStack.Screen name="Admin" component={AdminStack} />
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
