import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import usePrivateGameViewModel from '../ViewModel/usePrivateGameViewModel';

const JoinPrivateGamePage = () => {
  const navigation = useNavigation();
  const { joinCode, error, setJoinCode, joinWithCode } = usePrivateGameViewModel();
  const [submitting, setSubmitting] = useState(false);

  const handleJoinGame = async () => {
    setSubmitting(true);
    const group = await joinWithCode();
    setSubmitting(false);
    if (!group) {
      return;
    }
    navigation.navigate('(routes)/game-lobby');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Private Game</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Join Code"
        autoCapitalize="characters"
        maxLength={6}
        value={joinCode}
        onChangeText={setJoinCode}
      />
      <Pressable style={styles.button} onPress={handleJoinGame}>
        <Text style={styles.buttonText}>{submitting ? 'Joining...' : 'Join Game'}</Text>
      </Pressable>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  errorText: {
    color: '#dc2626',
  },
});

export default JoinPrivateGamePage;
