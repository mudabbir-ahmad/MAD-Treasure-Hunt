import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import Screen from '../layout/Screen';
import Card from '../UI/Card';
import {Button, ButtonTray} from '../UI/Button';
import useGameHook from '../../hooks/useGameHook';
import {getSession, setSessionTeam} from '../../hooks/SessionStore';

const TeamScreen = () => {
//   Initialisation ------------

    const session = getSession();
    const isAdmin = session.isAcceptedAdmin;
    const {getTeam, createTeam, joinTeamByCode, getTeamMembers, leaveTeam, getUser, updateUser, getAdminWaitlist} = useGameHook();

//   State ----------------------

    const [activeTid, setActiveTid] = useState(session.currentTid);
    const [teamCode, setTeamCode] = useState('');
    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [memberNames, setMemberNames] = useState({});
    const [loading, setLoading] = useState(true);
    const [onAdminWaitlist, setOnAdminWaitlist] = useState(false);

//   Handlers -------------------

    const loadTeamData = async (tid) => {
        const t = await getTeam(tid);
        setTeam(t);
        const ms = await getTeamMembers(tid);
        setMembers(ms || []);
        const names = {};
        for (const m of (ms || [])) {
            const u = await getUser(m.Uid);
            if (u) names[m.Uid] = u.username;
        }
        setMemberNames(names);
    };

    useEffect(() => {
        const load = async () => {
            // Check if the user is on the admin waitlist
            if (session.currentGid && !activeTid) {
                const waitlist = await getAdminWaitlist(session.currentGid, session.currentUid);
                if (waitlist.length > 0) {
                    setOnAdminWaitlist(true);
                    setLoading(false);
                    return;
                }
            }
            if (activeTid) await loadTeamData(activeTid);
            setLoading(false);
        };
        load();
    }, [activeTid]);

    const handleJoinTeam = async () => {
        if (!teamCode.trim()) return;
        // Force uppercase just in case a lowercase code is pasted
        const code = teamCode.trim().toUpperCase();
        const result = await joinTeamByCode({JoinCode: code, Uid: session.currentUid});
        if (!result) return;

        // If the server indicates this code matched the admin join code
        if (result.adminWaitlist) {
            setOnAdminWaitlist(true);
            return;
        }

        setSessionTeam(result.Tid);
        setActiveTid(result.Tid);
    };

    const handleCreateTeam = async () => {
        if (!session.currentGid) return;
        const result = await createTeam({Gid: session.currentGid, TeamName: 'My Team'});
        if (!result) return;
        const membership = await joinTeamByCode({Tid: result.Tid, Uid: session.currentUid});
        if (membership) {
            setSessionTeam(result.Tid);
            setActiveTid(result.Tid);
        }
    };

    const handleLeaveTeam = async () => {
        const myMembership = members.find((m) => m.Uid === session.currentUid);
        if (!myMembership) return;
        await leaveTeam(myMembership.id);
        await updateUser(session.currentUid, {TGid: null});
        setSessionTeam(null);
        setActiveTid(null);
        setTeam(null);
        setMembers([]);
        setMemberNames({});
    };

    const handleKickMember = async (member) => {
        await leaveTeam(member.id);
        await loadTeamData(activeTid);
    };

    // Check if current user is the team leader
    const myMembership = members.find((m) => m.Uid === session.currentUid);
    const isCurrentUserLeader = Boolean(myMembership?.IsLeader);

//   View -----------------------

    if (loading) {
        return (
            <Screen style={styles.center}>
                <ActivityIndicator size="large"/>
            </Screen>
        );
    }

    // Waiting for admin approval
    if (onAdminWaitlist) {
        return (
            <Screen style={styles.center}>
                <Text style={styles.waitlistText}>Waiting to be approved for Admin Team</Text>
            </Screen>
        );
    }

    // Not in a team
    if (!activeTid || !team) {
        return (
            <Screen style={styles.center}>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.codeInput}
                        placeholder="Enter Team Code"
                        placeholderTextColor="#9ca3af"
                        value={teamCode}
                        onChangeText={(text) => setTeamCode(text.toUpperCase())}
                        autoCapitalize="characters"
                    />
                    <Button
                        label="Join"
                        onClick={handleJoinTeam}
                        styleButton={styles.joinButton}
                        styleLabel={styles.joinLabel}
                    />
                </View>
                {!isAdmin && (
                    <View style={styles.fullRow}>
                        <ButtonTray>
                            <Button
                                label="Create Team"
                                onClick={handleCreateTeam}
                                styleButton={styles.createButton}
                                styleLabel={styles.createLabel}
                            />
                        </ButtonTray>
                    </View>
                )}
            </Screen>
        );
    }

    // In a team
    return (
        <Screen style={styles.container}>
            <View style={styles.teamHeader}>
                <Text style={styles.teamCodeLabel}>Team Code:</Text>
                <Text style={styles.teamCodeValue}>{team.JoinCode}</Text>
            </View>
            <ScrollView style={styles.memberList}>
                {members.map((m) => (
                    <Card key={m.id}>
                        <View style={styles.memberRow}>
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>
                                    {memberNames[m.Uid] || `Player ${m.Uid}`}
                                </Text>
                                {m.IsLeader && <Text style={styles.leaderBadge}>(Team Leader)</Text>}
                            </View>
                            {isCurrentUserLeader && m.Uid !== session.currentUid && (
                                <Button
                                    label="Kick"
                                    onClick={() => handleKickMember(m)}
                                    styleButton={styles.kickButton}
                                    styleLabel={styles.kickLabel}
                                />
                            )}
                        </View>
                    </Card>
                ))}
                {members.length === 0 && (
                    <Text style={styles.emptyText}>No members yet.</Text>
                )}
            </ScrollView>
            <View style={styles.leaveWrap}>
                <Button
                    label="Leave Team"
                    onClick={handleLeaveTeam}
                    styleButton={styles.leaveButton}
                    styleLabel={styles.leaveLabel}
                />
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    center: {justifyContent: 'center', alignItems: 'center'},
    container: {padding: 0},
    inputRow: {flexDirection: 'row', gap: 10, marginBottom: 15, width: '100%', paddingHorizontal: 20},
    fullRow: {width: '100%', paddingHorizontal: 20},
    codeInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#1f2937',
        backgroundColor: '#ffffff',
    },
    joinButton: {backgroundColor: '#2563eb', borderColor: '#2563eb', flex: 0, paddingHorizontal: 20},
    joinLabel: {color: '#ffffff', fontWeight: '600'},
    createButton: {backgroundColor: '#16a34a', borderColor: '#16a34a'},
    createLabel: {color: '#ffffff', fontWeight: '600'},
    waitlistText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        textAlign: 'center',
        paddingHorizontal: 30,
    },
    teamHeader: {
        backgroundColor: '#374151',
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    teamCodeLabel: {color: '#d1d5db', fontSize: 15, fontWeight: '600'},
    teamCodeValue: {color: '#ffffff', fontSize: 17, fontWeight: '700', letterSpacing: 2},
    memberList: {flex: 1, paddingHorizontal: 15, paddingTop: 10},
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    memberInfo: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6},
    memberName: {fontSize: 16, color: '#1f2937', fontWeight: '600'},
    leaderBadge: {fontSize: 12, color: '#2563eb', fontWeight: '700'},
    kickButton: {backgroundColor: '#dc2626', borderColor: '#dc2626', minHeight: 36, flex: 0, paddingHorizontal: 14},
    kickLabel: {color: '#ffffff', fontWeight: '600', fontSize: 13},
    emptyText: {color: '#9ca3af', textAlign: 'center', marginTop: 30, fontSize: 14},
    leaveWrap: {paddingHorizontal: 15, paddingVertical: 10},
    leaveButton: {backgroundColor: '#dc2626', borderColor: '#dc2626'},
    leaveLabel: {color: '#ffffff', fontWeight: '600'},
});

export default TeamScreen;
