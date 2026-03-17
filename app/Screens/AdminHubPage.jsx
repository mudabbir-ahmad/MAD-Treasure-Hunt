import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AdminFooterNavbar from '../components/AdminFooterNavbar';
import useAdminViewModel from '../ViewModel/useAdminViewModel';

const AdminHubPage = () => {
  const navigation = useNavigation();
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

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.title}>Admin Hub</Text>
        <Pressable style={styles.button} onPress={handleCreateGame}>
          <Text style={styles.buttonText}>Create a Game</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => navigation.navigate('(routes)/game-lobby')}>
          <Text style={styles.buttonText}>Manage Existing Game</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => navigation.navigate('(routes)/manage-subgroups')}>
          <Text style={styles.buttonText}>Manage Subgroups</Text>
        </Pressable>
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

export default AdminHubPage;

