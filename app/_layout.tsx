import {Stack} from "expo-router";

export default function RootLayout() {
  return (
    <Stack initialRouteName="(routes)/index" screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="Screens/LoginPage"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="Screens/LoginPage"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="Screens/RegisterPage"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="Screens/GameTypePage"/>
      <Stack.Screen name="Screens/JoinPrivateGamePage" />
      <Stack.Screen name="Screens/ManagePrivateSubtaskPage" />
      <Stack.Screen name="Screens/CreateGamePage" />
      <Stack.Screen name="Screens/ManageGamePage" />
      <Stack.Screen name="Screens/GameLobbyPage" />
      <Stack.Screen name="Screens/TeamPage" />
      <Stack.Screen name="Screens/MapPage" />
      <Stack.Screen name="Screens/AdminHubPage" />
      <Stack.Screen name="Screens/ManageSubgroupsPage" />
    </Stack>
  );
}
