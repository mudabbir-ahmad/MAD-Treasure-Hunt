import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import Screen from '../layout/Screen';
import Card from '../UI/Card';
import useGameHook from '../../hooks/useGameHook';
import {getSession} from '../../hooks/SessionStore';

const LeaderboardScreen = () => {
//   Initialisation ------------

    const session = getSession();
    const {getLobby, getTeams, getTeamMembers, getGroupMembers, getCaches, getUser} = useGameHook();

//   State ----------------------

    const [loading, setLoading] = useState(true);
    const [teamsEnabled, setTeamsEnabled] = useState(false);
    const [activeTab, setActiveTab] = useState('global');
    const [globalRanking, setGlobalRanking] = useState([]);
    const [teamRanking, setTeamRanking] = useState([]);
    const [expandedTeam, setExpandedTeam] = useState(null);

//   Handlers -------------------

    const loadData = useCallback(async () => {
        if (!session.currentGid) { setLoading(false); return; }

        const group = await getLobby(session.currentGid);
        const isTeams = Boolean(group?.TeamsEnabled);
        setTeamsEnabled(isTeams);

        const caches = await getCaches(session.currentGid, null);
        const claimedCaches = (caches || []).filter((c) => c.ClaimedByUid);

        if (isTeams) {
            // Build team rankings
            const teams = await getTeams(session.currentGid);
            const teamData = [];

            for (const team of (teams || [])) {
                const members = await getTeamMembers(team.Tid);
                const memberData = [];
                for (const m of (members || [])) {
                    const user = await getUser(m.Uid);
                    const count = claimedCaches.filter((c) => c.ClaimedByUid === m.Uid).length;
                    memberData.push({
                        uid: m.Uid,
                        name: user?.username || `Player ${m.Uid}`,
                        caches: count,
                        isLeader: Boolean(m.IsLeader),
                    });
                }
                memberData.sort((a, b) => b.caches - a.caches);
                const totalCaches = memberData.reduce((sum, m) => sum + m.caches, 0);
                teamData.push({
                    tid: team.Tid,
                    name: team.TeamName || 'Unnamed Team',
                    code: team.JoinCode,
                    totalCaches,
                    members: memberData,
                });
            }

            teamData.sort((a, b) => b.totalCaches - a.totalCaches);
            setGlobalRanking(teamData);

            // Build current team ranking
            if (session.currentTid) {
                const myTeam = teamData.find((t) => t.tid === session.currentTid);
                setTeamRanking(myTeam ? myTeam.members : []);
            }
        } else {
            // Build player rankings (no teams)
            const allMembers = await getGroupMembers(session.currentGid);
            const playerData = [];
            for (const m of (allMembers || []).filter((m) => !m.IsAcceptedAdmin)) {
                const user = await getUser(m.Uid);
                const count = claimedCaches.filter((c) => c.ClaimedByUid === m.Uid).length;
                playerData.push({
                    uid: m.Uid,
                    name: user?.username || `Player ${m.Uid}`,
                    caches: count,
                });
            }
            playerData.sort((a, b) => b.caches - a.caches);
            setGlobalRanking(playerData);
        }

        setLoading(false);
    }, [session.currentGid, session.currentTid]);

    useEffect(() => { loadData(); }, [loadData]);

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
                <Text style={styles.body}>Join a game to view the leaderboard.</Text>
            </Screen>
        );
    }

    // Teams enabled — tabbed view
    if (teamsEnabled) {
        return (
            <Screen style={styles.container}>
                <View style={styles.tabRow}>
                    <Pressable
                        style={[styles.tabButton, activeTab === 'global' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('global')}
                    >
                        <Text style={[styles.tabLabel, activeTab === 'global' && styles.tabLabelActive]}>Global</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.tabButton, activeTab === 'team' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('team')}
                    >
                        <Text style={[styles.tabLabel, activeTab === 'team' && styles.tabLabelActive]}>Team</Text>
                    </Pressable>
                </View>

                {activeTab === 'global' ? (
                    <ScrollView style={styles.listSection}>
                        {globalRanking.map((team, index) => (
                            <Pressable key={team.tid} onPress={() => setExpandedTeam(expandedTeam === team.tid ? null : team.tid)}>
                                <Card>
                                    <View style={styles.rankRow}>
                                        <Text style={styles.rank}>#{index + 1}</Text>
                                        <Text style={styles.rankName}>{team.name}</Text>
                                        <Text style={styles.score}>{team.totalCaches} cache(s)</Text>
                                    </View>
                                    {expandedTeam === team.tid && team.members.map((m) => (
                                        <View key={m.uid} style={styles.subRow}>
                                            <Text style={styles.subName}>
                                                {m.name}{m.isLeader ? ' (Leader)' : ''}
                                            </Text>
                                            <Text style={styles.subScore}>{m.caches}</Text>
                                        </View>
                                    ))}
                                </Card>
                            </Pressable>
                        ))}
                        {globalRanking.length === 0 && (
                            <Text style={styles.emptyText}>No teams yet.</Text>
                        )}
                    </ScrollView>
                ) : (
                    <ScrollView style={styles.listSection}>
                        {teamRanking.map((m, index) => (
                            <Card key={m.uid}>
                                <View style={styles.rankRow}>
                                    <Text style={styles.rank}>#{index + 1}</Text>
                                    <Text style={styles.rankName}>
                                        {m.name}{m.isLeader ? ' (Leader)' : ''}
                                    </Text>
                                    <Text style={styles.score}>{m.caches} cache(s)</Text>
                                </View>
                            </Card>
                        ))}
                        {teamRanking.length === 0 && (
                            <Text style={styles.emptyText}>Join a team to see your team leaderboard.</Text>
                        )}
                    </ScrollView>
                )}
            </Screen>
        );
    }

    // No teams — simple player ranking
    return (
        <Screen style={styles.container}>
            <ScrollView style={styles.listSection}>
                {globalRanking.map((player, index) => (
                    <Card key={player.uid}>
                        <View style={styles.rankRow}>
                            <Text style={styles.rank}>#{index + 1}</Text>
                            <Text style={styles.rankName}>{player.name}</Text>
                            <Text style={styles.score}>{player.caches} cache(s)</Text>
                        </View>
                    </Card>
                ))}
                {globalRanking.length === 0 && (
                    <Text style={styles.emptyText}>No players yet.</Text>
                )}
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    center: {justifyContent: 'center', alignItems: 'center'},
    container: {padding: 0},
    body: {color: '#4b5563', fontSize: 15},
    tabRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabButtonActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#2563eb',
    },
    tabLabel: {fontSize: 15, fontWeight: '600', color: '#6b7280'},
    tabLabelActive: {color: '#2563eb'},
    listSection: {flex: 1, paddingHorizontal: 15, paddingTop: 10},
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    rank: {fontSize: 16, fontWeight: '700', color: '#374151', width: 32},
    rankName: {flex: 1, fontSize: 15, fontWeight: '600', color: '#1f2937'},
    score: {fontSize: 14, fontWeight: '600', color: '#16a34a'},
    subRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 42,
        paddingVertical: 6,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    subName: {fontSize: 13, color: '#4b5563'},
    subScore: {fontSize: 13, fontWeight: '600', color: '#16a34a'},
    emptyText: {color: '#9ca3af', textAlign: 'center', marginTop: 30, fontSize: 14},
});

export default LeaderboardScreen;
