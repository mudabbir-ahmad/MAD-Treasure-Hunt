import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AdminFooterNavbar from '../components/AdminFooterNavbar';
import useAdminViewModel from '../ViewModel/useAdminViewModel';
import ScreenHeader from '../components/ScreenHeader';
import {getSession} from '../Model/SessionStore';

const AdminHubPage = () => {
  const navigation = useNavigation();
  const { currentIsBusiness } = getSession();
  const { createGame } = useAdminViewModel();

  const handleCreateGame = async () => {
    await createGame({
      groupName: `Admin Game ${Date.now().toString().slice(-4)}`,
      businessOrSchoolName: 'New Business',
      gameType: 'private',
      isBusiness: true,
    });
    navigation.navigate('(routes)/game-lobby');
  };

  if (!currentIsBusiness) {
    return (
      <View style={styles.wrapper}>
        <ScreenHeader title="Admin Hub" />
        <View style={styles.container}>
          <Text style={styles.message}>
            As an individual, your game is managed automatically. You can view and manage your active team from the Game Lobby.
          </Text>
          <Pressable style={styles.button} onPress={() => navigation.navigate('(routes)/game-lobby')}>
            <Text style={styles.buttonText}>Go to Game Lobby</Text>
          </Pressable>
        </View>
        <AdminFooterNavbar />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScreenHeader title="Admin Hub" />
      <View style={styles.container}>
        <ScrollView style={styles.buttonList}>
          <Pressable style={styles.button} onPress={handleCreateGame}>
            <Text style={styles.buttonText}>Create a Game</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => navigation.navigate('(routes)/game-lobby')}>
            <Text style={styles.buttonText}>Manage Existing Game</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => navigation.navigate('(routes)/manage-subgroups')}>
            <Text style={styles.buttonText}>Manage Subgroups</Text>
          </Pressable>
        </ScrollView>
      </View>
      <AdminFooterNavbar />
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
  message: {
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonList: {
    flex: 1,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default AdminHubPage;

