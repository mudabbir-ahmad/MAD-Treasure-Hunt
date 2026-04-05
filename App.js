import {NavigationContainer} from "@react-navigation/native";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
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

const Stack = createNativeStackNavigator();

const AuthStack = () => (
    <Stack.Navigator
        screenOptions={{headerShown: false}}
    >
        <Stack.Screen name="LoginScreen" component={LoginScreen}/>
        <Stack.Screen name="RegisterScreen" component={RegisterScreen}/>
    </Stack.Navigator>
);

const GameStack = () => (
    <Stack.Navigator
        screenOptions={{headerShown: false}}
    >
        <Stack.Screen name="GameTypeScreen" component={GameTypeScreen}/>
        <Stack.Screen name="JoinPrivateGameScreen" component={JoinPrivateGameScreen}/>
        <Stack.Screen name="ManagePrivateGameScreen" component={ManagePrivateGameScreen}/>
        <Stack.Screen name="CreateGameScreen" component={CreateGameScreen}/>
        <Stack.Screen name="ManageGameScreen" component={ManageGameScreen}/>
        <Stack.Screen name="GameLobbyScreen" component={GameLobbyScreen}/>
        <Stack.Screen name="LeaderboardScreen" component={LeaderboardScreen}/>
        <Stack.Screen name="TeamScreen" component={TeamScreen}/>
        <Stack.Screen name="MapScreen" component={MapScreen}/>
    </Stack.Navigator>
);

const AdminStack = () => (
    <Stack.Navigator
        screenOptions={{headerShown: false}}
    >
        <Stack.Screen name="AdminHubScreen" component={AdminHubScreen}/>
        <Stack.Screen name="ManageSubgroupsScreen" component={ManageSubgroupsScreen}/>
        <Stack.Screen name="LeaderboardScreen" component={LeaderboardScreen}/>
        <Stack.Screen name="MapScreen" component={MapScreen}/>
        <Stack.Screen name="TeamScreen" component={TeamScreen}/>
        <Stack.Screen name="CreateGameScreen" component={CreateGameScreen}/>
        <Stack.Screen name="ManageGameScreen" component={ManageGameScreen}/>
    </Stack.Navigator>
);

export const App = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{headerShown: false}}
            >
                <Stack.Screen name="Auth" component={AuthStack}/>
                <Stack.Screen name="Game" component={GameStack}/>
                <Stack.Screen name="Admin" component={AdminStack}/>
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default App;
