import {NavigationContainer} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {SafeAreaProvider} from "react-native-safe-area-context";
import LoginScreen from "./src/components/screens/LoginScreen";
import RegisterScreen from "./src/components/screens/RegisterScreen";
import GameTypeScreen from "./src/components/screens/GameTypeScreen";
import JoinPrivateGameScreen from "./src/components/screens/JoinPrivateGameScreen";
import ManagePrivateGameScreen from "./src/components/screens/ManagePrivateGameScreen";
import CreateGameScreen from "./src/components/screens/CreateGameScreen";
import ManageGameScreen from "./src/components/screens/ManageGameScreen";
import GameLobbyScreen from "./src/components/screens/GameLobbyScreen";
import TeamScreen from "./src/components/screens/TeamScreen";
import MapScreen from "./src/components/screens/MapScreen";
import LeaderboardScreen from "./src/components/screens/LeaderboardScreen";
import AdminHubScreen from "./src/components/screens/AdminHubScreen";
import ManageSubgroupsScreen from "./src/components/screens/ManageSubgroupsScreen";
import GameSettingsScreen from "./src/components/screens/GameSettingsScreen";
import PlayersScreen from "./src/components/screens/PlayersScreen";

const RootStack = createNativeStackNavigator();
const AuthStackNav = createNativeStackNavigator();
const GameStackNav = createNativeStackNavigator();
const AdminStackNav = createNativeStackNavigator();

const AuthStack = () => (
    <AuthStackNav.Navigator
        screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#ffffff' },
            keyboardHandlingEnabled: false,
        }}
    >
        <AuthStackNav.Screen name="LoginScreen" component={LoginScreen}/>
        <AuthStackNav.Screen name="RegisterScreen" component={RegisterScreen}/>
    </AuthStackNav.Navigator>
);

const GameStack = () => (
    <GameStackNav.Navigator
        screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#ffffff' },
        }}
    >
        <GameStackNav.Screen name="MapScreen" component={MapScreen}/>
        <GameStackNav.Screen name="TeamScreen" component={TeamScreen}/>
        <GameStackNav.Screen name="LeaderboardScreen" component={LeaderboardScreen}/>
        <GameStackNav.Screen name="GameSettingsScreen" component={GameSettingsScreen}/>
        <GameStackNav.Screen name="PlayersScreen" component={PlayersScreen}/>
        <GameStackNav.Screen name="GameTypeScreen" component={GameTypeScreen}/>
        <GameStackNav.Screen name="JoinPrivateGameScreen" component={JoinPrivateGameScreen}/>
        <GameStackNav.Screen name="ManagePrivateGameScreen" component={ManagePrivateGameScreen}/>
        <GameStackNav.Screen name="CreateGameScreen" component={CreateGameScreen}/>
        <GameStackNav.Screen name="ManageGameScreen" component={ManageGameScreen}/>
        <GameStackNav.Screen name="GameLobbyScreen" component={GameLobbyScreen}/>
    </GameStackNav.Navigator>
);

const AdminStack = () => (
    <AdminStackNav.Navigator
        screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#ffffff' },
        }}
    >
        <AdminStackNav.Screen name="GameSettingsScreen" component={GameSettingsScreen}/>
        <AdminStackNav.Screen name="MapScreen" component={MapScreen}/>
        <AdminStackNav.Screen name="LeaderboardScreen" component={LeaderboardScreen}/>
        <AdminStackNav.Screen name="PlayersScreen" component={PlayersScreen}/>
        <AdminStackNav.Screen name="AdminHubScreen" component={AdminHubScreen}/>
        <AdminStackNav.Screen name="ManageSubgroupsScreen" component={ManageSubgroupsScreen}/>
        <AdminStackNav.Screen name="TeamScreen" component={TeamScreen}/>
        <AdminStackNav.Screen name="CreateGameScreen" component={CreateGameScreen}/>
        <AdminStackNav.Screen name="ManageGameScreen" component={ManageGameScreen}/>
    </AdminStackNav.Navigator>
);

export const App = () => {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <RootStack.Navigator
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: '#ffffff' },
                    }}
                >
                    <RootStack.Screen name="Auth" component={AuthStack}/>
                    <RootStack.Screen name="Game" component={GameStack}/>
                    <RootStack.Screen name="Admin" component={AdminStack}/>
                </RootStack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
