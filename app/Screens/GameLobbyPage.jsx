import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import MemberFooterNavbar from '../components/MemberFooterNavbar';
import useLobbyViewModel from '../ViewModel/useLobbyViewModel';
import ScreenHeader from '../components/ScreenHeader';
import {getSession} from '../Model/SessionStore';

const GameLobbyPage = () => {
  const navigation = useNavigation();
  const { currentSGid, currentIsAcceptedAdmin } = getSession();
  const { teamCode, error, setTeamCode, createLobbyTeam, joinLobbyTeam } = useLobbyViewModel();
  const [hasTeam, setHasTeam] = useState(false);

  const isAdminUser = currentSGid === 0 && currentIsAcceptedAdmin;

  const handleCreateTeam = async () => {
    const team = await createLobbyTeam({
      teamName: `Team-${Date.now().toString().slice(-4)}`,
    });
    if (!team) {
      return;
    }
    setHasTeam(true);
    navigation.navigate('(routes)/team');
  };

  const handleJoinTeam = async () => {
    const team = await joinLobbyTeam();
    if (!team) {
      return;
    }
    setHasTeam(true);
    navigation.navigate('(routes)/team');
  };

  return (
    <View style={styles.wrapper}>
      <ScreenHeader title="Game Lobby" />
      <View style={styles.container}>
        {isAdminUser && (
          <View style={styles.adminMessage}>
            <Text style={styles.adminMessageText}>
              Admins cannot participate in teams. Manage your game from the Admin Hub instead.
            </Text>
          </View>
        )}
        {!isAdminUser && (
          <>
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
          </>
        )}
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('(routes)/map')}>
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
  adminMessage: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  adminMessageText: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default GameLobbyPage;
