import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';

const JoinPrivateGamePage = () => {
  const [joinCode, setJoinCode] = useState('');

  const handleJoinGame = () => {
    // Logic to check join code and redirect to game lobby
  };

  return (
    <View>
      <TextInput placeholder="Enter Join Code" value={joinCode} onChangeText={setJoinCode} />
      <Button title="Join Game" onPress={handleJoinGame} />
    </View>
  );
};

export default JoinPrivateGamePage;
