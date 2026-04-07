import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import Screen from '../layout/Screen';
import {Button, ButtonTray} from '../UI/Button';
import useGameHook from '../../hooks/useGameHook';
import {getSession, setSessionTeam} from '../../hooks/SessionStore';

const TeamScreen = () => {
//   Initialisation ------------

    const session = getSession();
    const isAdmin = session.isAcceptedAdmin;
    const {getTeam, createTeam, joinTeamByCode, getTeamMembers, leaveTeam, getUser, updateUser} = useGameHook();

//   State ----------------------

    const [activeTid, setActiveTid] = useState(session.currentTid);
    const [teamCode, setTeamCode] = useState('');
    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [memberNames, setMemberNames] = useState({});
    const [loading, setLoading] = useState(true);

//   Handlers -------------------

    useEffect(() => {
        const load = async () => {
            if (activeTid) {
                const t = await getTeam(activeTid);
                setTeam(t);
                const ms = await getTeamMembers(activeTid);
                setMembers(ms || []);
                const names = {};
                for (const m of (ms || [])) {
                    const u = await getUser(m.Uid);
                    if (u) names[m.Uid] = u.username;
                }
                setMemberNames(names);
            }
            setLoading(false);
        };
        load();
    }, [activeTid]);

    const handleJoinTeam = async () => {
        if (!teamCode.trim()) return;
        const result = await joinTeamByCode({JoinCode: teamCode.trim(), Uid: session.currentUid});
        if (!result) return;
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

//   View -----------------------

    if (loading) {
        return (
            <Screen style={styles.center}>
                <ActivityIndicator size="large"/>
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
                        value={teamCode}
                        onChangeText={setTeamCode}
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
                    <View key={m.id} style={styles.memberItem}>
                        <Text style={styles.memberName}>{memberNames[m.Uid] || `Player ${m.Uid}`}</Text>
                    </View>
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
    memberItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    memberName: {fontSize: 16, color: '#1f2937'},
    emptyText: {color: '#9ca3af', textAlign: 'center', marginTop: 30, fontSize: 14},
    leaveWrap: {padding: 15},
    leaveButton: {backgroundColor: '#dc2626', borderColor: '#dc2626'},
    leaveLabel: {color: '#ffffff', fontWeight: '600'},
});

export default TeamScreen;
