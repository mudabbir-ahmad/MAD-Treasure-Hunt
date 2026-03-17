import React from 'react';
import { View, Text, Button, TextInput } from 'react-native';

const GameLobbyPage = () => {
  return (
    <View>
      <Text>Game Lobby</Text>
      <Button title="Create Team" onPress={() => {}} />
      <Text>Join Team Code:</Text>
      <TextInput placeholder="Enter Team Join Code" />
    </View>
  );
};

export default GameLobbyPage;
