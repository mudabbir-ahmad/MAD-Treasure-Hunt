import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import Screen from '../layout/Screen';
import Card from '../UI/Card';
import {Button} from '../UI/Button';
import useGameHook from '../../hooks/useGameHook';
import {getSession} from '../../hooks/SessionStore';

const LeaderboardScreen = ({navigation, route}) => {
//   Initialisation ------------

    const session = getSession();
    const isAdmin = session.isAcceptedAdmin;
    const isBusiness = Boolean(session.isBusiness);
    const selectedDepartment = route?.params?.department || null;
    const {getLobby, getSubgroup, getTeams, getTeamMembers, getGroupMembers, getCaches, getUser, deleteTeam, resetPlayerProgress, resetTeamProgress, getSubgroups} = useGameHook();

//   State ----------------------

    const [loading, setLoading] = useState(true);
    const [teamsEnabled, setTeamsEnabled] = useState(false);
    const [activeTab, setActiveTab] = useState('game');
    const [teamRankings, setTeamRankings] = useState([]);
    const [playerRankings, setPlayerRankings] = useState([]);
    const [myTeamRanking, setMyTeamRanking] = useState([]);
    const [expandedTeam, setExpandedTeam] = useState(null);
    const [totalCacheCount, setTotalCacheCount] = useState(0);
    const [departmentList, setDepartmentList] = useState([]);

//   Handlers -------------------

    const loadData = useCallback(async () => {
        if (!session.currentGid) { setLoading(false); return; }

        const group = await getLobby(session.currentGid);

        const effectiveSGid = isBusiness
            ? ((isAdmin && selectedDepartment?.SGid) ? selectedDepartment.SGid : (isAdmin ? null : session.currentSGid))
            : null;

        let isTeams = Boolean(group?.TeamsEnabled);
        if (effectiveSGid !== null && effectiveSGid !== undefined) {
            const subgroup = await getSubgroup(effectiveSGid);
            if (subgroup) isTeams = Boolean(subgroup.TeamsEnabled);
        }
        setTeamsEnabled(isTeams);

        if (isBusiness && isAdmin && !selectedDepartment) {
            const sgs = await getSubgroups(session.currentGid);
            setDepartmentList((sgs || []).filter((sg) => !sg.IsAdminGroup));
            setLoading(false);
            return;
        }

        const caches = await getCaches(session.currentGid, effectiveSGid ?? null);
        const total = (caches || []).length;
        setTotalCacheCount(total);

        if (isTeams) {
            // Build team rankings
            const teams = await getTeams(session.currentGid, effectiveSGid ?? null);
            const teamData = [];

            for (const team of (teams || [])) {
                const members = await getTeamMembers(team.Tid);
                const memberData = [];
                for (const m of (members || [])) {
                    const user = await getUser(m.Uid);
                    const count = (caches || []).filter((c) =>
                        (c.Claims || []).some((cl) => cl.Uid === m.Uid)
                    ).length;
                    memberData.push({
                        uid: m.Uid,
                        name: user?.username || `Player ${m.Uid}`,
                        caches: count,
                        isLeader: Boolean(m.IsLeader),
                    });
                }
                memberData.sort((a, b) => b.caches - a.caches);
                const totalCaches = (caches || []).filter((c) =>
                    (c.Claims || []).some((cl) => cl.Tid === team.Tid)
                ).length;
                teamData.push({
                    tid: team.Tid,
                    name: team.TeamName || 'Unnamed Team',
                    code: team.JoinCode,
                    totalCaches,
                    members: memberData,
                });
            }

            teamData.sort((a, b) => b.totalCaches - a.totalCaches);
            setTeamRankings(teamData);

            // Build current user's team ranking (for TEAM tab)
            if (session.currentTid) {
                const myTeam = teamData.find((t) => t.tid === session.currentTid);
                setMyTeamRanking(myTeam ? myTeam.members : []);
            }
        } else {
            // Build player rankings (no teams)
            const scopedMembers = await getGroupMembers(session.currentGid, effectiveSGid ?? null);
            const playerData = [];
            for (const m of (scopedMembers || []).filter((mem) => !mem.IsAcceptedAdmin)) {
                const user = await getUser(m.Uid);
                const count = (caches || []).filter((c) =>
                    (c.Claims || []).some((cl) => cl.Uid === m.Uid)
                ).length;
                playerData.push({
                    uid: m.Uid,
                    name: user?.username || `Player ${m.Uid}`,
                    caches: count,
                });
            }
            playerData.sort((a, b) => b.caches - a.caches);
            setPlayerRankings(playerData);
        }

        setLoading(false);
    }, [session.currentGid, session.currentTid, session.currentSGid, isBusiness, isAdmin, selectedDepartment, selectedDepartment?.SGid]);

    useEffect(() => { loadData(); }, [loadData]);

    // Admin handler: delete a team and reload
    const handleDeleteTeam = (team) => {
        Alert.alert('Delete Team', `Delete "${team.name}" and kick all its members?`, [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteTeam(team.tid);
                    await loadData();
                },
            },
        ]);
    };

    // Admin handler: reset a single player's progress
    const handleResetPlayer = (player) => {
        Alert.alert('Reset Progress', `Reset all cache claims for ${player.name}?`, [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Reset',
                style: 'destructive',
                onPress: async () => {
                    await resetPlayerProgress(session.currentGid, player.uid);
                    Alert.alert('Done', `Progress for ${player.name} has been reset.`);
                    await loadData();
                },
            },
        ]);
    };

    const handleResetTeam = (team) => {
        Alert.alert('Reset Team Progress', `Reset all cache claims for team "${team.name}"?`, [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Reset',
                style: 'destructive',
                onPress: async () => {
                    await resetTeamProgress(session.currentGid, team.tid);
                    Alert.alert('Done', `Progress for team "${team.name}" has been reset.`);
                    await loadData();
                },
            },
        ]);
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
                <Text style={styles.body}>Join a game to view the leaderboard.</Text>
            </Screen>
        );
    }

    if (isBusiness && isAdmin && !selectedDepartment) {
        return (
            <Screen style={styles.container}>
                <Text style={styles.departmentTitle}>Departments</Text>
                <ScrollView style={styles.listSection}>
                    {departmentList.map((department) => (
                        <Pressable
                            key={department.SGid}
                            onPress={() => navigation.navigate('LeaderboardScreen', {department})}
                        >
                            <Card>
                                <View style={styles.rankRow}>
                                    <Text style={styles.rankName}>{department.SubGroupName}</Text>
                                    <Text style={styles.openLabel}>Open</Text>
                                </View>
                            </Card>
                        </Pressable>
                    ))}
                    {departmentList.length === 0 && (
                        <Text style={styles.emptyText}>No departments yet.</Text>
                    )}
                </ScrollView>
            </Screen>
        );
    }

    // Helper: render an expandable team card (admin version with delete + reset)
    const renderAdminTeamCard = (team, index) => (
        <Card key={team.tid}>
            <Pressable onPress={() => setExpandedTeam(expandedTeam === team.tid ? null : team.tid)}>
                <View style={styles.rankRow}>
                    <Text style={styles.rank}>#{index + 1}</Text>
                    <Text style={styles.rankName}>{team.name} ({team.code})</Text>
                    <Text style={styles.score}>{team.totalCaches}/{totalCacheCount}</Text>
                </View>
            </Pressable>
            {expandedTeam === team.tid && (
                <View>
                    {team.members.map((m) => (
                        // Highlight the current user's row so they can identify themselves
                        <View key={m.uid} style={[styles.subRow, m.uid === session.currentUid && styles.selfSubRow]}>
                            <Text style={[styles.subName, {flex: 1}]}>
                                {m.name}{m.isLeader ? ' (Team Leader)' : ''}
                            </Text>
                            <Text style={styles.subScore}>{m.caches}/{totalCacheCount}</Text>
                            <Pressable
                                style={styles.resetMiniButton}
                                onPress={() => handleResetPlayer(m)}
                            >
                                <Text style={styles.resetMiniLabel}>Reset</Text>
                            </Pressable>
                        </View>
                    ))}
                    <View style={styles.deleteTeamWrap}>
                        <Button
                            label="Reset Team Progress"
                            onClick={() => handleResetTeam(team)}
                            styleButton={styles.resetTeamButton}
                            styleLabel={styles.deleteTeamLabel}
                        />
                        <Button
                            label="Delete Team"
                            onClick={() => handleDeleteTeam(team)}
                            styleButton={styles.deleteTeamButton}
                            styleLabel={styles.deleteTeamLabel}
                        />
                    </View>
                </View>
            )}
        </Card>
    );

    // Helper: render an expandable team card (player version)
    const renderTeamCard = (team, index) => (
        <Pressable key={team.tid} onPress={() => setExpandedTeam(expandedTeam === team.tid ? null : team.tid)}>
            <Card>
                <View style={styles.rankRow}>
                    <Text style={styles.rank}>#{index + 1}</Text>
                    <Text style={styles.rankName}>{team.name} ({team.code})</Text>
                    <Text style={styles.score}>{team.totalCaches}/{totalCacheCount}</Text>
                </View>
                {expandedTeam === team.tid && team.members.map((m) => (
                    // Highlight the current user's row so they can identify themselves
                    <View key={m.uid} style={[styles.subRow, m.uid === session.currentUid && styles.selfSubRow]}>
                        <Text style={styles.subName}>
                            {m.name}{m.isLeader ? ' (Team Leader)' : ''}
                        </Text>
                        <Text style={styles.subScore}>{m.caches}/{totalCacheCount}</Text>
                    </View>
                ))}
            </Card>
        </Pressable>
    );

    // Helper: render an admin player card (with reset button)
    const renderAdminPlayerCard = (player, index) => (
        // Highlight the current user's card so they can identify themselves
        <Card key={player.uid} style={player.uid === session.currentUid ? styles.selfCard : undefined}>
            <View style={styles.rankRow}>
                <Text style={styles.rank}>#{index + 1}</Text>
                <Text style={styles.rankName}>{player.name}</Text>
                <Text style={styles.score}>{player.caches}/{totalCacheCount}</Text>
                <Pressable
                    style={styles.resetMiniButton}
                    onPress={() => handleResetPlayer(player)}
                >
                    <Text style={styles.resetMiniLabel}>Reset</Text>
                </Pressable>
            </View>
        </Card>
    );

    // Helper: render a simple player card
    const renderPlayerCard = (player, index) => (
        // Highlight the current user's card so they can identify themselves
        <Card key={player.uid} style={player.uid === session.currentUid ? styles.selfCard : undefined}>
            <View style={styles.rankRow}>
                <Text style={styles.rank}>#{index + 1}</Text>
                <Text style={styles.rankName}>{player.name}</Text>
                <Text style={styles.score}>{player.caches}/{totalCacheCount}</Text>
            </View>
        </Card>
    );

    // ---------- ADMIN LEADERBOARD ----------
    if (isAdmin) {
        // Teams enabled: show team list (no tabs for admin)
        if (teamsEnabled) {
            return (
                <Screen style={styles.container} showBack={Boolean(selectedDepartment)}>
                    {selectedDepartment && (
                        <Text style={styles.departmentTitle}>{selectedDepartment.SubGroupName}</Text>
                    )}
                    <ScrollView style={styles.listSection}>
                        {teamRankings.map((team, index) => renderAdminTeamCard(team, index))}
                        {teamRankings.length === 0 && (
                            <Text style={styles.emptyText}>No teams yet.</Text>
                        )}
                    </ScrollView>
                </Screen>
            );
        }

        // Teams disabled: show player list with reset buttons
        return (
            <Screen style={styles.container} showBack={Boolean(selectedDepartment)}>
                {selectedDepartment && (
                    <Text style={styles.departmentTitle}>{selectedDepartment.SubGroupName}</Text>
                )}
                <ScrollView style={styles.listSection}>
                    {playerRankings.map((player, index) => renderAdminPlayerCard(player, index))}
                    {playerRankings.length === 0 && (
                        <Text style={styles.emptyText}>No players yet.</Text>
                    )}
                </ScrollView>
            </Screen>
        );
    }

    // ---------- PLAYER LEADERBOARD ----------

    // Teams enabled — tabbed view (GAME / TEAM)
    if (teamsEnabled) {
        return (
            <Screen style={styles.container}>
                <View style={styles.tabRow}>
                    <Pressable
                        style={[styles.tabButton, activeTab === 'game' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('game')}
                    >
                        <Text style={[styles.tabLabel, activeTab === 'game' && styles.tabLabelActive]}>GAME</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.tabButton, activeTab === 'team' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('team')}
                    >
                        <Text style={[styles.tabLabel, activeTab === 'team' && styles.tabLabelActive]}>TEAM</Text>
                    </Pressable>
                </View>

                {activeTab === 'game' ? (
                    <ScrollView style={styles.listSection}>
                        {teamRankings.map((team, index) => renderTeamCard(team, index))}
                        {teamRankings.length === 0 && (
                            <Text style={styles.emptyText}>No teams yet.</Text>
                        )}
                    </ScrollView>
                ) : (
                    <ScrollView style={styles.listSection}>
                        {myTeamRanking.map((m, index) => (
                            // Highlight the current user's card so they can identify themselves
                            <Card key={m.uid} style={m.uid === session.currentUid ? styles.selfCard : undefined}>
                                <View style={styles.rankRow}>
                                    <Text style={styles.rank}>#{index + 1}</Text>
                                    <Text style={styles.rankName}>
                                        {m.name}{m.isLeader ? ' (Team Leader)' : ''}
                                    </Text>
                                    <Text style={styles.score}>{m.caches}/{totalCacheCount}</Text>
                                </View>
                            </Card>
                        ))}
                        {myTeamRanking.length === 0 && (
                            <Text style={styles.emptyText}>Join a team to see your team leaderboard.</Text>
                        )}
                    </ScrollView>
                )}
            </Screen>
        );
    }

    // No teams — simple player ranking (GAME tab only, no TEAM tab)
    return (
        <Screen style={styles.container}>
            <ScrollView style={styles.listSection}>
                {playerRankings.map((player, index) => renderPlayerCard(player, index))}
                {playerRankings.length === 0 && (
                    <Text style={styles.emptyText}>No players yet.</Text>
                )}
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    center: {justifyContent: 'center', alignItems: 'center'},
    container: {padding: 0},
    body: {color: '#bac2de', fontSize: 15},
    departmentTitle: {fontSize: 20, fontWeight: '700', color: '#cdd6f4', paddingHorizontal: 15, paddingTop: 15, marginBottom: 6},
    openLabel: {fontSize: 13, fontWeight: '700', color: '#bd93f9'},
    tabRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#45475a',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabButtonActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#bd93f9',
    },
    tabLabel: {fontSize: 15, fontWeight: '600', color: '#6c7086'},
    tabLabelActive: {color: '#bd93f9'},
    listSection: {flex: 1, paddingHorizontal: 15, paddingTop: 10},
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    rank: {fontSize: 16, fontWeight: '700', color: '#bac2de', width: 32},
    rankName: {flex: 1, fontSize: 15, fontWeight: '600', color: '#cdd6f4'},
    score: {fontSize: 14, fontWeight: '600', color: '#a6e3a1'},
    subRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 42,
        paddingVertical: 6,
        borderTopWidth: 1,
        borderTopColor: '#45475a',
    },
    subName: {fontSize: 13, color: '#bac2de'},
    subScore: {fontSize: 13, fontWeight: '600', color: '#a6e3a1', marginRight: 8},
    emptyText: {color: '#6c7086', textAlign: 'center', marginTop: 30, fontSize: 14},
    deleteTeamWrap: {marginTop: 8, paddingLeft: 42, flexDirection: 'row', gap: 8},
    resetTeamButton: {backgroundColor: '#f4a460', borderColor: '#f4a460', minHeight: 36, flex: 1},
    deleteTeamButton: {backgroundColor: '#D92800', borderColor: '#D92800', minHeight: 36, flex: 1},
    deleteTeamLabel: {color: '#1e1e2e', fontWeight: '600', fontSize: 13},
    resetMiniButton: {
        backgroundColor: '#86efac',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginLeft: 6,
    },
    resetMiniLabel: {color: '#1e1e2e', fontWeight: '600', fontSize: 12},
    selfCard: {backgroundColor: 'rgba(166, 227, 161, 0.15)', borderColor: '#a6e3a1'},
    selfSubRow: {backgroundColor: 'rgba(166, 227, 161, 0.15)'},
});

export default LeaderboardScreen;
