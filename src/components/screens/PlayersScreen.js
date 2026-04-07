import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import Screen from '../layout/Screen';
import Card from '../UI/Card';
import {Button} from '../UI/Button';
import useGameHook from '../../hooks/useGameHook';
import {getSession} from '../../hooks/SessionStore';

const PlayersScreen = () => {
//   Initialisation ------------

    const session = getSession();
    const {getLobby, getTeams, getTeamMembers, getGroupMembers, removeMember, getUser, getCaches} = useGameHook();

//   State ----------------------

    const [loading, setLoading] = useState(true);
    const [groupInfo, setGroupInfo] = useState(null);
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [memberNames, setMemberNames] = useState({});
    const [memberCacheCounts, setMemberCacheCounts] = useState({});
    const [detailLoading, setDetailLoading] = useState(false);

//   Handlers -------------------

    const loadData = useCallback(async () => {
        if (!session.currentGid) {
            setLoading(false);
            return;
        }
        const group = await getLobby(session.currentGid);
        setGroupInfo(group);

        if (group && group.TeamsEnabled) {
            const teamRows = await getTeams(session.currentGid);
            setTeams(teamRows || []);
        } else {
            const allMembers = await getGroupMembers(session.currentGid);
            const nonAdminMembers = (allMembers || []).filter((m) => !m.IsAcceptedAdmin);
            const playerList = [];
            for (const m of nonAdminMembers) {
                const user = await getUser(m.Uid);
                if (user) playerList.push({...user, membershipId: m.id});
            }
            setPlayers(playerList);
        }
        setLoading(false);
    }, [session.currentGid]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSelectTeam = async (team) => {
        setSelectedTeam(team);
        setDetailLoading(true);

        const ms = await getTeamMembers(team.Tid);
        setTeamMembers(ms || []);

        const names = {};
        for (const m of (ms || [])) {
            const user = await getUser(m.Uid);
            if (user) names[m.Uid] = user.username;
        }
        setMemberNames(names);

        const caches = await getCaches(session.currentGid, null);
        const counts = {};
        for (const m of (ms || [])) {
            counts[m.Uid] = (caches || []).filter((c) => c.ClaimedByUid === m.Uid).length;
        }
        setMemberCacheCounts(counts);
        setDetailLoading(false);
    };

    const handleBackToTeams = () => {
        setSelectedTeam(null);
        setTeamMembers([]);
        setMemberNames({});
        setMemberCacheCounts({});
    };

    const handleRemovePlayer = async (membershipId) => {
        await removeMember(membershipId);
        await loadData();
    };

    const handleRemoveTeamMember = async (member) => {
        // Find this user's subgroup membership to remove them from the game
        const allMembers = await getGroupMembers(session.currentGid);
        const membership = (allMembers || []).find((m) => m.Uid === member.Uid && !m.IsAcceptedAdmin);
        if (membership) {
            await removeMember(membership.id);
            await handleSelectTeam(selectedTeam);
        }
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

    // Teams enabled — show team detail view
    if (groupInfo?.TeamsEnabled && selectedTeam) {
        return (
            <Screen style={styles.container}>
                <View style={styles.teamDetailHeader}>
                    <Text style={styles.teamDetailName}>{selectedTeam.TeamName || 'Unnamed Team'}</Text>
                    <Text style={styles.teamDetailCode}>Code: {selectedTeam.JoinCode}</Text>
                </View>

                {detailLoading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large"/>
                    </View>
                ) : (
                    <ScrollView style={styles.listSection}>
                        <Text style={styles.sectionTitle}>Team Members</Text>
                        {teamMembers.map((m) => (
                            <Card key={m.id}>
                                <View style={styles.memberRow}>
                                    <Text style={styles.memberName}>
                                        {memberNames[m.Uid] || `Player ${m.Uid}`}
                                    </Text>
                                    <Text style={styles.memberCaches}>
                                        {memberCacheCounts[m.Uid] || 0} cache(s) claimed
                                    </Text>
                                </View>
                                <View style={styles.removeWrap}>
                                    <Button
                                        label="Remove"
                                        onClick={() => handleRemoveTeamMember(m)}
                                        styleButton={styles.removeButton}
                                        styleLabel={styles.removeLabel}
                                    />
                                </View>
                            </Card>
                        ))}
                        {teamMembers.length === 0 && (
                            <Text style={styles.emptyText}>No members in this team.</Text>
                        )}
                    </ScrollView>
                )}

                <View style={styles.backWrap}>
                    <Button
                        label="Back to Teams"
                        onClick={handleBackToTeams}
                        styleButton={styles.backButton}
                        styleLabel={styles.backLabel}
                    />
                </View>
            </Screen>
        );
    }

    // Teams enabled — show team cards
    if (groupInfo?.TeamsEnabled) {
        return (
            <Screen style={styles.container}>
                <Text style={styles.sectionTitle}>Teams</Text>
                <ScrollView style={styles.listSection}>
                    {teams.map((team) => (
                        <Pressable key={team.Tid} onPress={() => handleSelectTeam(team)}>
                            <Card>
                                <View style={styles.teamCardRow}>
                                    <Text style={styles.teamName}>
                                        {team.TeamName || 'Unnamed Team'}
                                    </Text>
                                    <Text style={styles.teamCode}>
                                        Code: {team.JoinCode}
                                    </Text>
                                </View>
                            </Card>
                        </Pressable>
                    ))}
                    {teams.length === 0 && (
                        <Text style={styles.emptyText}>No teams have been created yet.</Text>
                    )}
                </ScrollView>
            </Screen>
        );
    }

    // Teams disabled — show player list
    return (
        <Screen style={styles.container}>
            <Text style={styles.sectionTitle}>Players</Text>
            <ScrollView style={styles.listSection}>
                {players.map((player) => (
                    <Card key={player.Uid}>
                        <View style={styles.memberRow}>
                            <Text style={styles.playerName}>{player.username}</Text>
                        </View>
                        <View style={styles.removeWrap}>
                            <Button
                                label="Remove"
                                onClick={() => handleRemovePlayer(player.membershipId)}
                                styleButton={styles.removeButton}
                                styleLabel={styles.removeLabel}
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
    // Team cards
    teamCardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    teamName: {fontSize: 16, fontWeight: '600', color: '#1f2937'},
    teamCode: {fontSize: 14, fontWeight: '700', color: '#2563eb', letterSpacing: 1},
    // Team detail
    teamDetailHeader: {
        backgroundColor: '#374151',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    teamDetailName: {fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 4},
    teamDetailCode: {fontSize: 14, fontWeight: '600', color: '#93c5fd', letterSpacing: 1},
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    memberName: {fontSize: 16, fontWeight: '600', color: '#1f2937'},
    memberCaches: {fontSize: 13, fontWeight: '600', color: '#16a34a'},
    // Remove button
    removeWrap: {marginTop: 8},
    removeButton: {backgroundColor: '#dc2626', borderColor: '#dc2626', minHeight: 36},
    removeLabel: {color: '#ffffff', fontWeight: '600', fontSize: 13},
    backWrap: {padding: 15},
    backButton: {backgroundColor: '#6b7280', borderColor: '#6b7280'},
    backLabel: {color: '#ffffff', fontWeight: '600'},
    // Player list
    playerName: {fontSize: 16, fontWeight: '600', color: '#1f2937'},
});

export default PlayersScreen;

