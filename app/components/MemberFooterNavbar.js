import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MemberFooterNavbar = ({ visible = false }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
      <Pressable style={styles.button} onPress={() => navigation.navigate('(routes)/game-lobby')}>
        <Text style={styles.text}>Lobby</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => navigation.navigate('(routes)/team')}>
        <Text style={styles.text}>Team</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => navigation.navigate('(routes)/map')}>
        <Text style={styles.text}>Map</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#d4d4d8',
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: '#ffffff',
    minHeight: 86,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});

export default MemberFooterNavbar;

