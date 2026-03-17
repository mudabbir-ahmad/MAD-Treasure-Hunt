import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MemberFooterNavbar from '../components/MemberFooterNavbar';
import useLobbyViewModel from '../ViewModel/useLobbyViewModel';

const GameLobbyPage = () => {
  const navigation = useNavigation();
  const { teamCode, error, setTeamCode, createLobbyTeam, joinLobbyTeam } = useLobbyViewModel();
  const [hasTeam, setHasTeam] = useState(false);

  const handleCreateTeam = async () => {
    const team = await createLobbyTeam({
      teamName: `Team-${Date.now().toString().slice(-4)}`,
    });
    if (!team) {
      return;
    }
    setHasTeam(true);
    navigation.navigate('team');
  };

  const handleJoinTeam = async () => {
    const team = await joinLobbyTeam();
    if (!team) {
      return;
    }
    setHasTeam(true);
    navigation.navigate('team');
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.title}>Game Lobby</Text>
        <TextInput
          style={styles.input}
          placeholder="Join Team Code"
          autoCapitalize="characters"
          maxLength={6}
          value={teamCode}
          onChangeText={setTeamCode}
        />
        <Pressable style={styles.secondaryButton} onPress={handleJoinTeam}>
          <Text style={styles.buttonText}>Join Team</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={handleCreateTeam}>
          <Text style={styles.buttonText}>Create Team</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('map')}>
          <Text style={styles.buttonText}>Open Map</Text>
        </Pressable>
        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>
      <MemberFooterNavbar visible={hasTeam} />
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
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#4b5563',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  errorText: {
    color: '#dc2626',
  },
});

export default GameLobbyPage;
