import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useGameTypeViewModel from '../ViewModel/useGameTypeViewModel';

const GameTypePage = () => {
  const navigation = useNavigation();
  const { gameTypes } = useGameTypeViewModel();

  const navigateByType = (label) => {
    if (label === 'Join Global Game') {
      navigation.navigate('game-lobby');
      return;
    }
    if (label === 'Join Private Game') {
      navigation.navigate('join-private-game');
      return;
    }
    navigation.navigate('manage-private-subtask');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Game Type</Text>
      {gameTypes.map((label) => (
        <Pressable key={label} style={styles.button} onPress={() => navigateByType(label)}>
          <Text style={styles.buttonText}>{label}</Text>
        </Pressable>
      ))}
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
});

export default GameTypePage;
