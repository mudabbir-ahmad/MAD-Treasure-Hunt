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
    const {getTeams, getTeamMembers, getGroupMembers, removeMember, resetPlayerProgress, getUser, getAdminWaitlist, approveAdmin, rejectAdmin} = useGameHook();

//   State ----------------------

    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState([]);

//   Handlers -------------------

    const loadData = useCallback(async () => {
        if (!session.currentGid) { setLoading(false); return; }

        // Get ALL members (including admins)
        const allMembers = await getGroupMembers(session.currentGid);

        // Get admin waitlist entries
        const waitlist = await getAdminWaitlist(session.currentGid);

        // Deduplicate allMembers by Uid — a user may have two rows if they were a
        // regular member before being approved as an admin. Prefer the admin row.
        const seenUids = new Set();
        const uniqueMembers = (allMembers || [])
            .sort((a, b) => (b.IsAcceptedAdmin ? 1 : 0) - (a.IsAcceptedAdmin ? 1 : 0))
            .filter((m) => { if (seenUids.has(m.Uid)) return false; seenUids.add(m.Uid); return true; });

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

        // Build player list — include admins with tags
        const playerList = [];
        for (const m of uniqueMembers) {
            // Skip the current admin viewing the list
            if (m.Uid === session.currentUid) continue;
            const user = await getUser(m.Uid);
            if (user) {
                // A group member may also be on the admin waitlist (applied after joining as a player).
                // Check the waitlist first so they are treated as pending, not a regular player.
                const waitlistEntry = (waitlist || []).find((w) => w.Uid === m.Uid);
                let adminTag = null;
                let waitlistId = null;
                if (waitlistEntry) {
                    adminTag = '[Admin Awaiting Response]';
                    waitlistId = waitlistEntry.id;
                } else if (m.IsAcceptedAdmin) {
                    adminTag = '[ADMIN]';
                }
                playerList.push({
                    ...user,
                    membershipId: m.id,
                    team: teamInfoByUid[m.Uid] || null,
                    adminTag,
                    waitlistId,
                });
            }
        }

        // Include waitlisted users who are not yet group members at all
        for (const w of (waitlist || [])) {
            if (playerList.some((p) => p.Uid === w.Uid)) continue;
            if (w.Uid === session.currentUid) continue;
            const user = await getUser(w.Uid);
            if (user) {
                playerList.push({
                    ...user,
                    membershipId: null,
                    team: null,
                    adminTag: '[Admin Awaiting Response]',
                    waitlistId: w.id,
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

    // Approve a waitlisted admin and refresh the list
    const handleApproveAdmin = async (player) => {
        await approveAdmin(player.waitlistId);
        await loadData();
    };

    // Deny (remove from waitlist) a pending admin and refresh the list
    const handleDenyAdmin = async (player) => {
        await rejectAdmin(player.waitlistId);
        await loadData();
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
                    // Waitlisted admins get a light red tint so they stand out from regular players
                    <Card key={player.Uid} style={player.waitlistId ? styles.waitlistCard : undefined}>
                        <View style={styles.playerRow}>
                            <Text style={styles.playerName} numberOfLines={1}>
                                {player.username}
                                {player.adminTag && (
                                    <Text style={player.adminTag === '[ADMIN]' ? styles.adminBadge : styles.waitlistBadge}>
                                        {' '}{player.adminTag}
                                    </Text>
                                )}
                            </Text>
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
                            {/* Waitlisted admins get Approve / Deny instead of the normal player actions */}
                            {player.waitlistId ? (
                                <>
                                    <Button
                                        label="Approve"
                                        onClick={() => handleApproveAdmin(player)}
                                        styleButton={styles.approveButton}
                                        styleLabel={styles.actionLabel}
                                    />
                                    <Button
                                        label="Deny"
                                        onClick={() => handleDenyAdmin(player)}
                                        styleButton={styles.denyButton}
                                        styleLabel={styles.actionLabel}
                                    />
                                </>
                            ) : (
                                <>
                                    {!player.adminTag && (
                                        <Button
                                            label="Reset Progress"
                                            onClick={() => handleResetPlayerProgress(player)}
                                            styleButton={styles.resetButton}
                                            styleLabel={styles.actionLabel}
                                        />
                                    )}
                                    {player.membershipId && (
                                        <Button
                                            label="Kick"
                                            onClick={() => handleRemovePlayer(player.membershipId)}
                                            styleButton={styles.removeButton}
                                            styleLabel={styles.actionLabel}
                                        />
                                    )}
                                </>
                            )}
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
    adminBadge: {fontSize: 12, fontWeight: '700', color: '#dc2626'},
    waitlistBadge: {fontSize: 11, fontWeight: '600', color: '#f59e0b'},
    actionRow: {flexDirection: 'row', gap: 8},
    resetButton: {backgroundColor: '#f59e0b', borderColor: '#f59e0b', minHeight: 36, flex: 1, paddingHorizontal: 10},
    removeButton: {backgroundColor: '#dc2626', borderColor: '#dc2626', minHeight: 36, flex: 1, paddingHorizontal: 10},
    actionLabel: {color: '#ffffff', fontWeight: '600', fontSize: 13},
    // Waitlisted admin card tint — light red so they read as pending, not regular players
    waitlistCard: {backgroundColor: '#FFD1DC', borderColor: '#fca5a5'},
    // Approve / deny buttons for waitlisted admins
    approveButton: {backgroundColor: '#16a34a', borderColor: '#16a34a', minHeight: 36, flex: 1, paddingHorizontal: 10},
    denyButton: {backgroundColor: '#dc2626', borderColor: '#dc2626', minHeight: 36, flex: 1, paddingHorizontal: 10},
});

export default PlayersScreen;
