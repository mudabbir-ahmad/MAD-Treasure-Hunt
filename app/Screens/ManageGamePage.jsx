import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';

const ManageGamePage = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.wrapper}>
      <ScreenHeader title="Manage Game" />
      <View style={styles.container}>
        <Text style={styles.body}>Manage your active team from here.</Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate('(routes)/team')}>
          <Text style={styles.buttonText}>Open Team Manager</Text>
        </Pressable>
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
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  body: {
    color: '#4b5563',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default ManageGamePage;

