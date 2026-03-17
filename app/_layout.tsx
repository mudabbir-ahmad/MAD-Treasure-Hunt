import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack initialRouteName="(routes)/index">
      <Stack.Screen name="(routes)/index" options={{ headerShown: false }} />
      <Stack.Screen name="(routes)/login" options={{ title: "Login" }} />
      <Stack.Screen name="(routes)/register" options={{ title: "Register" }} />
      <Stack.Screen name="(routes)/game-type" options={{ title: "Select Game Type" }} />
      <Stack.Screen name="(routes)/join-private-game" options={{ title: "Join Private Game" }} />
      <Stack.Screen name="(routes)/manage-private-subtask" options={{ title: "Manage Private Game" }} />
      <Stack.Screen name="(routes)/game-lobby" options={{ title: "Game Lobby" }} />
      <Stack.Screen name="(routes)/team" options={{ title: "Team" }} />
      <Stack.Screen name="(routes)/map" options={{ title: "Map" }} />
      <Stack.Screen name="(routes)/admin-hub" options={{ title: "Admin Hub" }} />
      <Stack.Screen name="(routes)/manage-subgroups" options={{ title: "Manage Subgroups" }} />
    </Stack>
  );
}
