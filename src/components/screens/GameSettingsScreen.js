import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Screen from '../layout/Screen';
import Card from '../UI/Card';
import {Button, ButtonTray} from '../UI/Button';
import useGameHook from '../../hooks/useGameHook';
import {getSession, setSessionTeamsEnabled} from '../../hooks/SessionStore';

const GameSettingsScreen = ({navigation}) => {
  const session = getSession();
  const {getLobby, updateGroup, getSubgroups, createSubgroup, deleteSubgroup, resetGame, getAdminWaitlist, approveAdmin, rejectAdmin, getUser, disbandTeams} = useGameHook();
  const gameApiRef = useRef({
    getLobby,
    getSubgroups,
    getAdminWaitlist,
    getUser,
  });
  gameApiRef.current = {
    getLobby,
    getSubgroups,
    getAdminWaitlist,
    getUser,
  };
  const isMountedRef = useRef(true);
  const isRefreshingRef = useRef(false);
  const hasHydratedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [teamsEnabled, setTeamsEnabled] = useState(session.teamsEnabled);
  const [serverTeamsEnabled, setServerTeamsEnabled] = useState(session.teamsEnabled);
  const [cacheTriggerMeters, setCacheTriggerMeters] = useState('20');
  const [adminJoinCode, setAdminJoinCode] = useState('');
  const [orgJoinCode, setOrgJoinCode] = useState('');
  const [memberJoinCode, setMemberJoinCode] = useState('');
  const [waitlist, setWaitlist] = useState([]);
  const [waitlistNames, setWaitlistNames] = useState({});
  const [isBusinessGroup, setIsBusinessGroup] = useState(Boolean(session.isBusiness));
  const [subgroupList, setSubgroupList] = useState([]);
  const [newDeptName, setNewDeptName] = useState('');

//   Handlers -------------------

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const refreshSettings = useCallback(async ({showLoader = false} = {}) => {
    const activeSession = getSession();
    if (!activeSession.currentGid) {
      if (isMountedRef.current) setLoading(false);
      return;
    }

    // Guard against re-entrant focus refresh calls.
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    if (showLoader && isMountedRef.current) setLoading(true);

        try {
            const [group, sgs, waitlistRows] = await Promise.all([
                gameApiRef.current.getLobby(activeSession.currentGid),
                gameApiRef.current.getSubgroups(activeSession.currentGid),
                gameApiRef.current.getAdminWaitlist(activeSession.currentGid),
            ]);

            if (!isMountedRef.current) return;

            if (group) {
                setGroupName(group.GroupName || '');
                setBusinessName(group.BusinessOrSchoolName || '');
                // Organisation mode
                setIsBusinessGroup(Boolean(group.BusinessOrSchoolName));

                const serverTeams = Boolean(group.TeamsEnabled);
                setTeamsEnabled(serverTeams);
                setServerTeamsEnabled(serverTeams);
                setSessionTeamsEnabled(serverTeams);

                setCacheTriggerMeters(String(group.CacheTriggerMeters || 20));
                setAdminJoinCode(group.AdminJoinCode || '');
                setOrgJoinCode(group.OrgJoinCode || '');
            }

            setSubgroupList(sgs || []);
            const memberSg = (sgs || []).find((sg) => !sg.IsAdminGroup);
            setMemberJoinCode(memberSg?.JoinCode || '');

            setWaitlist(waitlistRows || []);
            const names = {};
            for (const entry of (waitlistRows || [])) {
                const user = await gameApiRef.current.getUser(entry.Uid);
                if (user) names[entry.Uid] = user.username;
            }
            if (!isMountedRef.current) return;
            setWaitlistNames(names);
            hasHydratedRef.current = true;
        } finally {
            if (isMountedRef.current && (showLoader || !hasHydratedRef.current)) {
                setLoading(false);
            }
            isRefreshingRef.current = false;
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshSettings({showLoader: !hasHydratedRef.current});
        }, [refreshSettings]),
    );

    // --- Individual save ---
    const saveSettings = async () => {
        setSaving(true);
        const result = await updateGroup(session.currentGid, {
            GroupName: groupName.trim(),
            TeamsEnabled: teamsEnabled,
            CacheTriggerMeters: parseInt(cacheTriggerMeters) || 20,
        });
        if (result) {
            if (serverTeamsEnabled && !teamsEnabled) {
                await disbandTeams(session.currentGid);
            }
            setSessionTeamsEnabled(teamsEnabled);
            setServerTeamsEnabled(teamsEnabled);
        }
        setSaving(false);
    };

    const handleSave = async () => {
        if (!session.currentGid) return;
        // Business save — only save business name
        if (isBusinessGroup) {
            setSaving(true);
            await updateGroup(session.currentGid, {
                BusinessOrSchoolName: businessName.trim(),
                GroupName: businessName.trim(),
            });
            setSaving(false);
            return;
        }
        // Individual save — check teams toggle
        if (serverTeamsEnabled && !teamsEnabled) {
            Alert.alert(
                'Disable Teams',
                'This will disband all existing teams and remove all players from their teams. Continue?',
                [
                    {text: 'Cancel', style: 'cancel'},
                    {text: 'Disable', style: 'destructive', onPress: saveSettings},
                ],
            );
            return;
        }
        await saveSettings();
    };

    const handleResetGame = () => {
        Alert.alert('Reset Entire Game', 'This will remove ALL saved caches and reset progress for every player. Are you sure?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Reset',
                style: 'destructive',
                onPress: async () => {
                    await resetGame(session.currentGid);
                    Alert.alert('Done', 'All caches and player progress have been reset.');
                },
            },
        ]);
    };

    const handleApproveAdmin = async (entry) => {
        await approveAdmin(entry.id);
        await refreshSettings();
    };

    const handleRejectAdmin = async (entry) => {
        await rejectAdmin(entry.id);
        await refreshSettings();
    };

    // Business — create a new department (subgroup)
    const handleCreateDepartment = async () => {
        const deptCount = subgroupList.filter((sg) => !sg.IsAdminGroup).length;
        const name = newDeptName.trim() || `Department ${deptCount + 1}`;
        if (!session.currentGid) return;
        await createSubgroup({
            SubGroupName: name,
            Gid: session.currentGid,
            IsAdminGroup: false,
            CacheTriggerMeters: 20,
        });
        setNewDeptName('');
        await refreshSettings();
    };

    // Business — delete a department
    const handleDeleteDepartment = (sg) => {
        Alert.alert('Delete Department', `Delete "${sg.SubGroupName}" and all its data?`, [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteSubgroup(sg.SGid);
                    await refreshSettings();
                },
            },
        ]);
    };

    // Business — navigate to department settings
    const handleEnterDepartment = (sg) => {
        navigation.navigate('DepartmentSettingsScreen', {
            SGid: sg.SGid,
            Gid: session.currentGid,
            SubGroupName: sg.SubGroupName,
        });
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

    // Filter subgroups for the department list (non-admin only)
    const departments = subgroupList.filter((sg) => !sg.IsAdminGroup);

    // ===== Business Admin View =====
    if (isBusinessGroup) {
        return (
            <Screen>
                <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>Game Configuration :</Text>

                    <Text style={styles.label}>Organisation Name:</Text>
                    <TextInput
                        style={styles.input}
                        value={businessName}
                        onChangeText={setBusinessName}
                        placeholder="Enter organisation name"
                        placeholderTextColor="#9ca3af"
                    />

                    <View style={styles.codeSection}>
                        <Text style={styles.codeLabel}>Admin join code:</Text>
                        <Text style={styles.codeValue}>{adminJoinCode || '—'}</Text>
                    </View>

                    <View style={styles.codeSection}>
                        <Text style={styles.codeLabel}>Org join code:</Text>
                        <Text style={styles.codeValue}>{orgJoinCode || '—'}</Text>
                    </View>

                    <View style={styles.saveWrap}>
                        <ButtonTray>
                            <Button
                                label={saving ? 'Saving...' : 'Save Settings'}
                                onClick={handleSave}
                                styleButton={styles.saveButton}
                                styleLabel={styles.saveLabel}
                            />
                        </ButtonTray>
                    </View>

                    {/* Departments List */}
                    <View style={styles.deptSection}>
                        <Text style={styles.sectionTitle}>Departments:</Text>
                        {departments.map((sg, index) => (
                            <Card key={sg.SGid}>
                                <Text style={styles.deptIndexLabel}>Department {index + 1}:</Text>
                                <View style={styles.deptCardRow}>
                                    <View style={styles.deptCardInfo}>
                                        <Text style={styles.deptInfoLabel}>Department Name</Text>
                                        <Text style={styles.deptName}>{sg.SubGroupName}</Text>
                                    </View>
                                    <View style={styles.deptCardActions}>
                                        <Button
                                            label="Department Game"
                                            onClick={() => handleEnterDepartment(sg)}
                                            styleButton={styles.deptOpenButton}
                                            styleLabel={styles.deptBtnLabel}
                                        />
                                    </View>
                                </View>
                                <View style={styles.deptCardRow}>
                                    <View style={styles.deptCardInfo}>
                                        <Text style={styles.deptInfoLabel}>Department Join code</Text>
                                        <Text style={styles.deptCode}>{sg.JoinCode || '—'}</Text>
                                    </View>
                                    <View style={styles.deptCardActions}>
                                        <Button
                                            label="Delete Department"
                                            onClick={() => handleDeleteDepartment(sg)}
                                            styleButton={styles.deptDeleteButton}
                                            styleLabel={styles.deptBtnLabel}
                                        />
                                    </View>
                                </View>
                            </Card>
                        ))}
                        {departments.length === 0 && (
                            <Text style={styles.emptyText}>No departments yet.</Text>
                        )}
                        <View style={styles.createDeptRow}>
                            <TextInput
                                style={[styles.input, {flex: 1}]}
                                value={newDeptName}
                                onChangeText={setNewDeptName}
                                placeholder="New department name"
                                placeholderTextColor="#9ca3af"
                            />
                            <Button
                                label="Add"
                                onClick={handleCreateDepartment}
                                styleButton={styles.createDeptButton}
                                styleLabel={styles.createDeptLabel}
                            />
                        </View>
                    </View>

                    {/* Admin Waitlist */}
                    {waitlist.length > 0 && (
                        <View style={styles.waitlistSection}>
                            <Text style={styles.sectionTitle}>Admin Waitlist</Text>
                            {waitlist.map((entry) => (
                                <Card key={entry.id}>
                                    <View style={styles.waitlistRow}>
                                        <Text style={styles.waitlistName}>
                                            {waitlistNames[entry.Uid] || `User ${entry.Uid}`}
                                        </Text>
                                        <View style={styles.waitlistActions}>
                                            <Button
                                                label="Approve"
                                                onClick={() => handleApproveAdmin(entry)}
                                                styleButton={styles.approveButton}
                                                styleLabel={styles.approveBtnLabel}
                                            />
                                            <Button
                                                label="Reject"
                                                onClick={() => handleRejectAdmin(entry)}
                                                styleButton={styles.rejectButton}
                                                styleLabel={styles.rejectBtnLabel}
                                            />
                                        </View>
                                    </View>
                                </Card>
                            ))}
                        </View>
                    )}

                    {/* Reset Entire Game */}
                    <View style={styles.resetSection}>
                        <Button
                            label="Reset Entire Game"
                            onClick={handleResetGame}
                            styleButton={styles.resetButton}
                            styleLabel={styles.resetLabel}
                        />
                    </View>
                </ScrollView>
            </Screen>
        );
    }

    // ===== Individual Admin View =====
    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Game Configuration</Text>

                <Text style={styles.label}>Game Name</Text>
                <TextInput
                    style={styles.input}
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholder="Enter game name"
                    placeholderTextColor="#9ca3af"
                />

                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Teams Enabled</Text>
                    <Switch
                        value={teamsEnabled}
                        onValueChange={setTeamsEnabled}
                        trackColor={{false: '#d1d5db', true: '#93c5fd'}}
                        thumbColor={teamsEnabled ? '#2563eb' : '#9ca3af'}
                    />
                </View>

                <Text style={styles.label}>Cache Claim Distance (metres)</Text>
                <TextInput
                    style={styles.input}
                    value={cacheTriggerMeters}
                    onChangeText={setCacheTriggerMeters}
                    keyboardType="numeric"
                    placeholder="20"
                    placeholderTextColor="#9ca3af"
                />

                <View style={styles.codeSection}>
                    <Text style={styles.codeLabel}>Admin Join Code</Text>
                    <Text style={styles.codeValue}>{adminJoinCode || '—'}</Text>
                </View>

                <View style={styles.codeSection}>
                    <Text style={styles.codeLabel}>Game Join Code</Text>
                    <Text style={styles.codeValue}>{memberJoinCode || '—'}</Text>
                </View>

                <View style={styles.saveWrap}>
                    <ButtonTray>
                        <Button
                            label={saving ? 'Saving...' : 'Save Settings'}
                            onClick={handleSave}
                            styleButton={styles.saveButton}
                            styleLabel={styles.saveLabel}
                        />
                    </ButtonTray>
                </View>

                {/* Admin Waitlist */}
                {waitlist.length > 0 && (
                    <View style={styles.waitlistSection}>
                        <Text style={styles.sectionTitle}>Admin Waitlist</Text>
                        {waitlist.map((entry) => (
                            <Card key={entry.id}>
                                <View style={styles.waitlistRow}>
                                    <Text style={styles.waitlistName}>
                                        {waitlistNames[entry.Uid] || `User ${entry.Uid}`}
                                    </Text>
                                    <View style={styles.waitlistActions}>
                                        <Button
                                            label="Approve"
                                            onClick={() => handleApproveAdmin(entry)}
                                            styleButton={styles.approveButton}
                                            styleLabel={styles.approveBtnLabel}
                                        />
                                        <Button
                                            label="Reject"
                                            onClick={() => handleRejectAdmin(entry)}
                                            styleButton={styles.rejectButton}
                                            styleLabel={styles.rejectBtnLabel}
                                        />
                                    </View>
                                </View>
                            </Card>
                        ))}
                    </View>
                )}

                {/* Reset Entire Game */}
                <View style={styles.resetSection}>
                    <Button
                        label="Reset Entire Game"
                        onClick={handleResetGame}
                        styleButton={styles.resetButton}
                        styleLabel={styles.resetLabel}
                    />
                </View>
            </ScrollView>
        </Screen>
    );
};

const styles = StyleSheet.create({
    center: {justifyContent: 'center', alignItems: 'center'},
    formContainer: {paddingBottom: 20},
    sectionTitle: {fontSize: 20, fontWeight: '700', color: '#cdd6f4', marginBottom: 16},
    label: {fontSize: 14, fontWeight: '600', color: '#bac2de', marginBottom: 6, marginTop: 14},
    body: {color: '#bac2de', fontSize: 15},
    input: {
        borderWidth: 1,
        borderColor: '#45475a',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#cdd6f4',
        backgroundColor: '#313244',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#45475a',
    },
    toggleLabel: {fontSize: 14, fontWeight: '600', color: '#bac2de'},
    codeSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#313244',
        borderRadius: 8,
    },
    codeLabel: {fontSize: 14, fontWeight: '600', color: '#bac2de'},
    codeValue: {fontSize: 16, fontWeight: '700', color: '#bd93f9', letterSpacing: 2},
    saveWrap: {marginTop: 24},
    saveButton: {backgroundColor: '#a6e3a1', borderColor: '#a6e3a1'},
    saveLabel: {color: '#1e1e2e', fontWeight: '600'},
    deptSection: {marginTop: 30},
    deptIndexLabel: {fontSize: 14, fontWeight: '700', color: '#bac2de', marginBottom: 8},
    deptCardRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
    deptCardInfo: {flex: 1, paddingRight: 10},
    deptCardActions: {flexDirection: 'row', gap: 6, flex: 0},
    deptInfoLabel: {fontSize: 12, fontWeight: '600', color: '#6c7086', marginBottom: 2},
    deptName: {fontSize: 15, fontWeight: '700', color: '#cdd6f4'},
    deptCode: {fontSize: 13, fontWeight: '600', color: '#bd93f9', marginTop: 2, letterSpacing: 1},
    deptDeleteButton: {backgroundColor: '#D92800', borderColor: '#D92800', minHeight: 36, flex: 0, paddingHorizontal: 10},
    deptOpenButton: {backgroundColor: '#bd93f9', borderColor: '#bd93f9', minHeight: 36, flex: 0, paddingHorizontal: 10},
    deptBtnLabel: {color: '#1e1e2e', fontWeight: '600', fontSize: 13},
    createDeptRow: {flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center'},
    createDeptButton: {backgroundColor: '#a6e3a1', borderColor: '#a6e3a1', flex: 0, paddingHorizontal: 16},
    createDeptLabel: {color: '#1e1e2e', fontWeight: '600'},
    emptyText: {color: '#6c7086', textAlign: 'center', marginTop: 10, fontSize: 14},
    waitlistSection: {marginTop: 30},
    waitlistRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    waitlistName: {fontSize: 15, fontWeight: '600', color: '#cdd6f4', flex: 1},
    waitlistActions: {flexDirection: 'row', gap: 6},
    approveButton: {backgroundColor: '#a6e3a1', borderColor: '#a6e3a1', minHeight: 36, flex: 0, paddingHorizontal: 10},
    approveBtnLabel: {color: '#1e1e2e', fontWeight: '600', fontSize: 13},
    rejectButton: {backgroundColor: '#D92800', borderColor: '#D92800', minHeight: 36, flex: 0, paddingHorizontal: 10},
    rejectBtnLabel: {color: '#1e1e2e', fontWeight: '600', fontSize: 13},
    resetSection: {marginTop: 30},
    resetButton: {backgroundColor: '#D92800', borderColor: '#D92800'},
    resetLabel: {color: '#ffffff', fontWeight: '600'},
});

export default GameSettingsScreen;

