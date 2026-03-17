import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MemberFooterNavbar from '../components/MemberFooterNavbar';
import useMapViewModel from '../ViewModel/useMapViewModel';
import ScreenHeader from '../components/ScreenHeader';

const MapPage = () => {
  const { points } = useMapViewModel();

  return (
    <View style={styles.wrapper}>
      <ScreenHeader title="Map" />
      <View style={styles.container}>
        <Text style={styles.body}>Map and hunt markers appear here.</Text>
        <Text style={styles.body}>Points loaded: {points.length}</Text>
      </View>
      <MemberFooterNavbar visible />
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
    gap: 6,
  },
  body: {
    color: '#4b5563',
  },
});

export default MapPage;

