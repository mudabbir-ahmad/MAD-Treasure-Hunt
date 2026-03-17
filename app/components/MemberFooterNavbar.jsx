import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const MemberFooterNavbar = ({ visible = false }) => {
  const navigation = useNavigation();

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={() => navigation.navigate('game-lobby')}>
        <Text style={styles.text}>Lobby</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => navigation.navigate('team')}>
        <Text style={styles.text}>Team</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => navigation.navigate('map')}>
        <Text style={styles.text}>Map</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#d4d4d8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});

export default MemberFooterNavbar;

