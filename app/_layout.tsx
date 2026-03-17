import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack initialRouteName="index">
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="register" options={{ title: "Register" }} />
      <Stack.Screen name="game-type" options={{ title: "Select Game Type" }} />
      <Stack.Screen name="join-private-game" options={{ title: "Join Private Game" }} />
      <Stack.Screen name="manage-private-subtask" options={{ title: "Manage Private Game" }} />
      <Stack.Screen name="game-lobby" options={{ title: "Game Lobby" }} />
      <Stack.Screen name="team" options={{ title: "Team" }} />
      <Stack.Screen name="map" options={{ title: "Map" }} />
      <Stack.Screen name="admin-hub" options={{ title: "Admin Hub" }} />
      <Stack.Screen name="manage-subgroups" options={{ title: "Manage Subgroups" }} />
    </Stack>
  );
}
