import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useGameTypeViewModel from '../ViewModel/useGameTypeViewModel';
import ScreenHeader from '../components/ScreenHeader';

const GameTypePage = () => {
  const navigation = useNavigation();
  const { gameTypes } = useGameTypeViewModel();

  const navigateByType = (label) => {
    if (label === 'Join Global Game') {
      navigation.navigate('(routes)/game-lobby');
      return;
    }
    if (label === 'Join Private Game') {
      navigation.navigate('(routes)/join-private-game');
      return;
    }
    navigation.navigate('(routes)/manage-private-subtask');
  };

  return (
    <View style={styles.wrapper}>
      <ScreenHeader title="Select Game Type" />
      <View style={styles.container}>
        {gameTypes.map((label) => (
          <Pressable key={label} style={styles.button} onPress={() => navigateByType(label)}>
            <Text style={styles.buttonText}>{label}</Text>
          </Pressable>
        ))}
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
