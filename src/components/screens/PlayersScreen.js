import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View} from 'react-native';
import Screen from '../layout/Screen';
import Card from '../UI/Card';
import {Button} from '../UI/Button';
import useGameHook from '../../hooks/useGameHook';
import {getSession} from '../../hooks/SessionStore';

const PlayersScreen = () => {
//   Initialisation ------------

    const session = getSession();
    const {getTeams, getTeamMembers, getGroupMembers, removeMember, resetPlayerProgress, getUser} = useGameHook();

//   State ----------------------

    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState([]);

//   Handlers -------------------

    const loadData = useCallback(async () => {
        if (!session.currentGid) { setLoading(false); return; }

        // Get all non-admin players
        const allMembers = await getGroupMembers(session.currentGid);
        const nonAdminMembers = (allMembers || []).filter((m) => !m.IsAcceptedAdmin);

        // Build team lookup: { Uid -> { teamCode, teamName, isLeader } }
        const allTeams = await getTeams(session.currentGid);
        const teamInfoByUid = {};
        for (const team of (allTeams || [])) {
            const tms = await getTeamMembers(team.Tid);
            for (const tm of (tms || [])) {
                teamInfoByUid[tm.Uid] = {
                    teamCode: team.JoinCode,
                    teamName: team.TeamName,
                    isLeader: Boolean(tm.IsLeader),
                };
            }
        }

        // Build player list
        const playerList = [];
        for (const m of nonAdminMembers) {
            const user = await getUser(m.Uid);
            if (user) {
                playerList.push({
                    ...user,
                    membershipId: m.id,
                    team: teamInfoByUid[m.Uid] || null,
                });
            }
        }
        setPlayers(playerList);
        setLoading(false);
    }, [session.currentGid]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleRemovePlayer = async (membershipId) => {
        await removeMember(membershipId);
        await loadData();
    };

    const handleResetPlayerProgress = (player) => {
        Alert.alert(
            'Reset Progress',
            `Reset all cache claims for ${player.username}?`,
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        await resetPlayerProgress(session.currentGid, player.Uid);
                        Alert.alert('Done', `Progress for ${player.username} has been reset.`);
                    },
                },
            ],
        );
    };

//   View -----------------------

    if (loading) {
        return (
            <Screen style={styles.center}>
                <ActivityIndicator size="large"/>
            </Screen>
        );
    }

    if (!session.currentGid) {
        return (
            <Screen style={styles.center}>
                <Text style={styles.body}>Create or join a game first.</Text>
            </Screen>
        );
    }

    return (
        <Screen style={styles.container}>
            <Text style={styles.sectionTitle}>Players</Text>
            <ScrollView style={styles.listSection}>
                {players.map((player) => (
                    <Card key={player.Uid}>
                        <View style={styles.playerRow}>
                            <Text style={styles.playerName} numberOfLines={1}>{player.username}</Text>
                            <View style={styles.playerMeta}>
                                {player.team?.isLeader && (
                                    <Text style={styles.leaderBadge}>(Team Leader)</Text>
                                )}
                                {player.team && (
                                    <Text style={styles.teamCodeBadge}>{player.team.teamCode}</Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.actionRow}>
                            <Button
                                label="Reset Progress"
                                onClick={() => handleResetPlayerProgress(player)}
                                styleButton={styles.resetButton}
                                styleLabel={styles.actionLabel}
                            />
                            <Button
                                label="Kick"
                                onClick={() => handleRemovePlayer(player.membershipId)}
                                styleButton={styles.removeButton}
                                styleLabel={styles.actionLabel}
                            />
                        </View>
                    </Card>
                ))}
                {players.length === 0 && (
                    <Text style={styles.emptyText}>No players have joined yet.</Text>
                )}
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    center: {justifyContent: 'center', alignItems: 'center', flex: 1},
    container: {padding: 0},
    body: {color: '#4b5563', fontSize: 15},
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
        paddingHorizontal: 15,
        paddingTop: 15,
    },
    listSection: {flex: 1, paddingHorizontal: 15},
    emptyText: {color: '#9ca3af', textAlign: 'center', marginTop: 30, fontSize: 14},
    playerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    playerName: {fontSize: 15, fontWeight: '600', color: '#1f2937', flex: 1},
    playerMeta: {flexDirection: 'row', alignItems: 'center', gap: 6},
    leaderBadge: {fontSize: 11, color: '#2563eb', fontWeight: '700'},
    teamCodeBadge: {fontSize: 12, fontWeight: '700', color: '#16a34a', letterSpacing: 1},
    actionRow: {flexDirection: 'row', gap: 8},
    resetButton: {backgroundColor: '#f59e0b', borderColor: '#f59e0b', minHeight: 36, flex: 1, paddingHorizontal: 10},
    removeButton: {backgroundColor: '#dc2626', borderColor: '#dc2626', minHeight: 36, flex: 1, paddingHorizontal: 10},
    actionLabel: {color: '#ffffff', fontWeight: '600', fontSize: 13},
});

export default PlayersScreen;
