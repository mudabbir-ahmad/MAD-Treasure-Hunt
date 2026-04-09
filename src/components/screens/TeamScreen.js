import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import Screen from '../layout/Screen';
import Card from '../UI/Card';
import {Button, ButtonTray} from '../UI/Button';
import useGameHook from '../../hooks/useGameHook';
import {getSession, setSessionTeam} from '../../hooks/SessionStore';

const TeamScreen = () => {
  const session = getSession();
  const isAdmin = session.isAcceptedAdmin;
  const isBusiness = Boolean(session.isBusiness);
  const {getLobby, getSubgroup, getTeam, createTeam, joinTeamByCode, getTeamMembers, leaveTeam, getUser, updateUser, updateTeam, getAdminWaitlist} = useGameHook();

  const [activeTid, setActiveTid] = useState(session.currentTid);
  const [teamCode, setTeamCode] = useState('');
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberNames, setMemberNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [teamsDisabled, setTeamsDisabled] = useState(false);
  const [onAdminWaitlist, setOnAdminWaitlist] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [teamNameDraft, setTeamNameDraft] = useState('');

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
            if (!session.currentGid) { setLoading(false); return; }

            const group = await getLobby(session.currentGid);
            let teamsAreEnabled = Boolean(group?.TeamsEnabled);

            if (isBusiness && session.currentSGid) {
                const subgroup = await getSubgroup(session.currentSGid);
                if (subgroup) teamsAreEnabled = Boolean(subgroup.TeamsEnabled);
            }

            if (!teamsAreEnabled) {
                setTeamsDisabled(true);
                setLoading(false);
                return;
            }
            setTeamsDisabled(false);

            if (!activeTid) {
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
        const result = await joinTeamByCode({
            JoinCode: code,
            Uid: session.currentUid,
            ExpectedSGid: session.currentSGid,
        });
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
        const result = await createTeam({Gid: session.currentGid, SGid: session.currentSGid, TeamName: 'My Team'});
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

    const handleRenameTeam = async () => {
        const trimmed = teamNameDraft.trim();
        if (!trimmed || !activeTid) return;
        const result = await updateTeam(activeTid, {TeamName: trimmed});
        if (result) {
            setTeam(result);
            setEditingName(false);
        }
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

    if (teamsDisabled) {
        return (
            <Screen style={styles.center}>
                <View style={styles.disabledWrap}>
                    <Text style={styles.disabledTitle}>Teams Disabled</Text>
                    <Text style={styles.disabledBody}>The admin has not enabled teams for this game.</Text>
                </View>
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
        // Disable team actions until the user has joined a game
        const notInGame = !session.currentGid;

        return (
            <Screen style={styles.center}>
                {notInGame && (
                    <Text style={styles.notInGameText}>Join a game first to manage teams.</Text>
                )}
                <View style={styles.inputRow}>
                    <TextInput
                        style={[styles.codeInput, notInGame && styles.inputDisabled]}
                        placeholder="Enter Team Code"
                        placeholderTextColor="#9ca3af"
                        value={teamCode}
                        onChangeText={(text) => setTeamCode(text.toUpperCase())}
                        autoCapitalize="characters"
                        editable={!notInGame}
                    />
                    <Button
                        label="Join"
                        onClick={handleJoinTeam}
                        styleButton={styles.joinButton}
                        styleLabel={styles.joinLabel}
                        disabled={notInGame}
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
                                disabled={notInGame}
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

            {/* Team name display / edit */}
            <View style={styles.teamNameSection}>
                {editingName ? (
                    <View style={styles.renameRow}>
                        <TextInput
                            style={styles.renameInput}
                            value={teamNameDraft}
                            onChangeText={setTeamNameDraft}
                            placeholder="Team name"
                            placeholderTextColor="#9ca3af"
                            autoFocus
                        />
                        <Button
                            label="Save"
                            onClick={handleRenameTeam}
                            styleButton={styles.renameSaveButton}
                            styleLabel={styles.renameSaveLabel}
                        />
                        <Button
                            label="Cancel"
                            onClick={() => setEditingName(false)}
                            styleButton={styles.renameCancelButton}
                            styleLabel={styles.renameCancelLabel}
                        />
                    </View>
                ) : (
                    <View style={styles.renameRow}>
                        <Text style={styles.teamNameText}>{team.TeamName || 'Unnamed Team'}</Text>
                        {isCurrentUserLeader && (
                            <Button
                                label="Rename"
                                onClick={() => { setTeamNameDraft(team.TeamName || ''); setEditingName(true); }}
                                styleButton={styles.renameButton}
                                styleLabel={styles.renameLabel}
                            />
                        )}
                    </View>
                )}
            </View>

            <ScrollView style={styles.memberList}>
                {members.map((m) => (
                    // Highlight the current user's card so they can identify themselves
                    <Card key={m.id} style={m.Uid === session.currentUid ? styles.selfCard : undefined}>
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
                {/* Leave button lives inside the scroll so it is never obscured by the bottom nav bar */}
                <View style={styles.leaveWrap}>
                    <Button
                        label="Leave Team"
                        onClick={handleLeaveTeam}
                        styleButton={styles.leaveButton}
                        styleLabel={styles.leaveLabel}
                    />
                </View>
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    center: {justifyContent: 'center', alignItems: 'center'},
    container: {padding: 0},
    disabledWrap: {paddingHorizontal: 30, alignItems: 'center', opacity: 0.45},
    disabledTitle: {fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 10, textAlign: 'center'},
    disabledBody: {fontSize: 15, color: '#ffffff', textAlign: 'center'},
    notInGameText: {color: '#ffffff', fontSize: 15, fontWeight: '600', marginBottom: 16, textAlign: 'center', paddingHorizontal: 20},
    inputDisabled: {backgroundColor: '#313244', opacity: 0.5},
    inputRow: {flexDirection: 'row', gap: 10, marginBottom: 15, width: '100%', paddingHorizontal: 20},
    fullRow: {width: '100%', paddingHorizontal: 20},
    codeInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#45475a',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#ffffff',
        backgroundColor: '#313244',
    },
    joinButton: {backgroundColor: '#bd93f9', borderColor: '#bd93f9', flex: 0, paddingHorizontal: 20},
    joinLabel: {color: '#1e1e2e', fontWeight: '600'},
    createButton: {backgroundColor: '#a6e3a1', borderColor: '#a6e3a1'},
    createLabel: {color: '#1e1e2e', fontWeight: '600'},
    waitlistText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        paddingHorizontal: 30,
    },
    teamHeader: {
        backgroundColor: '#45475a',
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    teamCodeLabel: {color: '#ffffff', fontSize: 15, fontWeight: '600'},
    teamCodeValue: {color: '#ffffff', fontSize: 17, fontWeight: '700', letterSpacing: 2},
    teamNameSection: {paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#45475a'},
    teamNameText: {fontSize: 18, fontWeight: '700', color: '#ffffff', flex: 1},
    renameRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
    renameInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#45475a',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        color: '#ffffff',
        backgroundColor: '#313244',
    },
    renameButton: {backgroundColor: '#bd93f9', borderColor: '#bd93f9', flex: 0, minHeight: 36, paddingHorizontal: 14},
    renameLabel: {color: '#1e1e2e', fontWeight: '600', fontSize: 13},
    renameSaveButton: {backgroundColor: '#a6e3a1', borderColor: '#a6e3a1', flex: 0, minHeight: 36, paddingHorizontal: 12},
    renameSaveLabel: {color: '#1e1e2e', fontWeight: '600', fontSize: 13},
    renameCancelButton: {backgroundColor: '#6c7086', borderColor: '#6c7086', flex: 0, minHeight: 36, paddingHorizontal: 12},
    renameCancelLabel: {color: '#cdd6f4', fontWeight: '600', fontSize: 13},
    memberList: {flex: 1, paddingHorizontal: 15, paddingTop: 10},
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    memberInfo: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6},
    memberName: {fontSize: 16, color: '#ffffff', fontWeight: '600'},
    leaderBadge: {fontSize: 12, color: '#bd93f9', fontWeight: '700'},
    kickButton: {backgroundColor: '#D92800', borderColor: '#D92800', minHeight: 36, flex: 0, paddingHorizontal: 14},
    kickLabel: {color: '#1e1e2e', fontWeight: '600', fontSize: 13},
    emptyText: {color: '#ffffff', textAlign: 'center', marginTop: 30, fontSize: 14},
    leaveWrap: {paddingHorizontal: 0, paddingTop: 10, paddingBottom: 16},
    leaveButton: {backgroundColor: '#D92800', borderColor: '#D92800'},
    leaveLabel: {color: '#1e1e2e', fontWeight: '600'},
    selfCard: {backgroundColor: 'rgba(166, 227, 161, 0.15)', borderColor: '#a6e3a1'},
});

export default TeamScreen;
