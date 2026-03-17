import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const AdminFooterNavbar = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={() => navigation.navigate('(routes)/admin-hub')}>
        <Text style={styles.text}>Admin Hub</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => navigation.navigate('(routes)/game-lobby')}>
        <Text style={styles.text}>Manage Game</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => navigation.navigate('(routes)/team')}>
        <Text style={styles.text}>Manage Team</Text>
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

export default AdminFooterNavbar;

