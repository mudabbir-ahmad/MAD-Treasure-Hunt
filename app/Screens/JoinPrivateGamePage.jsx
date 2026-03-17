import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import usePrivateGameViewModel from '../ViewModel/usePrivateGameViewModel';
import ScreenHeader from '../components/ScreenHeader';

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
    <View style={styles.wrapper}>
      <ScreenHeader title="Join Private Game" />
      <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 12,
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
