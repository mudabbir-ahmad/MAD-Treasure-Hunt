import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack initialRouteName="(routes)/index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(routes)/index" />
      <Stack.Screen name="(routes)/login" />
      <Stack.Screen name="(routes)/register" />
      <Stack.Screen name="(routes)/game-type" />
      <Stack.Screen name="(routes)/join-private-game" />
      <Stack.Screen name="(routes)/manage-private-subtask" />
      <Stack.Screen name="(routes)/game-lobby" />
      <Stack.Screen name="(routes)/team" />
      <Stack.Screen name="(routes)/map" />
      <Stack.Screen name="(routes)/admin-hub" />
      <Stack.Screen name="(routes)/manage-subgroups" />
    </Stack>
  );
}
