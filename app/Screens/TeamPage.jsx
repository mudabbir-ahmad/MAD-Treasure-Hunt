import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MemberFooterNavbar from '../components/MemberFooterNavbar';
import useTeamViewModel from '../ViewModel/useTeamViewModel';
import ScreenHeader from '../components/ScreenHeader';

const TeamPage = () => {
  const { team } = useTeamViewModel();

  return (
    <View style={styles.wrapper}>
      <ScreenHeader title="Team" />
      <View style={styles.container}>
        <Text style={styles.body}>Team details and members appear here.</Text>
        <Text style={styles.body}>{team?.team?.TeamName || 'No team joined yet'}</Text>
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

export default TeamPage;

