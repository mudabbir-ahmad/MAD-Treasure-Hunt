import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';

const CreateGamePage = () => {
  return (
    <View style={styles.wrapper}>
      <ScreenHeader title="Create Game" />
      <View style={styles.container}>
        <Text style={styles.body}>Create game setup goes here.</Text>
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
    padding: 20,
  },
  body: {
    color: '#4b5563',
    fontSize: 15,
  },
});

export default CreateGamePage;

