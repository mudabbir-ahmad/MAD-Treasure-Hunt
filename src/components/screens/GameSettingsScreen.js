import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import Screen from '../layout/Screen';
import Card from '../UI/Card';
import {Button, ButtonTray} from '../UI/Button';
import useGameHook from '../../hooks/useGameHook';
import {getSession, setSessionTeamsEnabled} from '../../hooks/SessionStore';

const GameSettingsScreen = () => {
//   Initialisation ------------

    const session = getSession();
    const {getLobby, updateGroup, getSubgroups, createSubgroup, updateSubgroup, deleteSubgroup, resetGame, getAdminWaitlist, approveAdmin, rejectAdmin, getUser} = useGameHook();
    const isBusiness = Boolean(session.isBusiness);

//   State ----------------------

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [teamsEnabled, setTeamsEnabled] = useState(session.teamsEnabled);
    const [cacheTriggerMeters, setCacheTriggerMeters] = useState('20');
    const [adminJoinCode, setAdminJoinCode] = useState('');
    const [memberJoinCode, setMemberJoinCode] = useState('');
    const [waitlist, setWaitlist] = useState([]);
    const [waitlistNames, setWaitlistNames] = useState({});
    // Business subgroup management
    const [subgroupList, setSubgroupList] = useState([]);
    const [newDeptName, setNewDeptName] = useState('');
    const [editingSGid, setEditingSGid] = useState(null);
    const [editDeptTrigger, setEditDeptTrigger] = useState('20');

//   Handlers -------------------

    const loadWaitlist = async () => {
        if (!session.currentGid) return;
        const rows = await getAdminWaitlist(session.currentGid);
        setWaitlist(rows || []);
        const names = {};
        for (const entry of (rows || [])) {
            const u = await getUser(entry.Uid);
            if (u) names[entry.Uid] = u.username;
        }
        setWaitlistNames(names);
    };

    const loadSubgroups = async () => {
        if (!session.currentGid) return;
        const sgs = await getSubgroups(session.currentGid);
        setSubgroupList(sgs || []);
        // Set the default member join code from first non-admin subgroup
        const memberSg = (sgs || []).find((sg) => !sg.IsAdminGroup);
        if (memberSg) setMemberJoinCode(memberSg.JoinCode || '');
    };

    useEffect(() => {
        const load = async () => {
            if (!session.currentGid) {
                setLoading(false);
                return;
            }
            const group = await getLobby(session.currentGid);
            if (group) {
                setGroupName(group.GroupName || '');
                const serverTeams = Boolean(group.TeamsEnabled);
                setTeamsEnabled(serverTeams);
                // Keep session in sync so the toggle survives app reloads
                setSessionTeamsEnabled(serverTeams);
                setCacheTriggerMeters(String(group.CacheTriggerMeters || 20));
                setAdminJoinCode(group.AdminJoinCode || '');
            }
            await loadSubgroups();
            await loadWaitlist();
            setLoading(false);
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!session.currentGid) return;
        setSaving(true);
        const result = await updateGroup(session.currentGid, {
            GroupName: groupName.trim(),
            TeamsEnabled: teamsEnabled,
            CacheTriggerMeters: parseInt(cacheTriggerMeters) || 20,
        });
        // Persist the new toggle value so the session reflects it after a reload
        if (result) setSessionTeamsEnabled(teamsEnabled);
        setSaving(false);
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
        await loadWaitlist();
    };

    const handleRejectAdmin = async (entry) => {
        await rejectAdmin(entry.id);
        await loadWaitlist();
    };

    // Business — create a new department (subgroup)
    const handleCreateDepartment = async () => {
        if (!newDeptName.trim() || !session.currentGid) return;
        await createSubgroup({
            SubGroupName: newDeptName.trim(),
            Gid: session.currentGid,
            IsAdminGroup: false,
            CacheTriggerMeters: parseInt(cacheTriggerMeters) || 20,
        });
        setNewDeptName('');
        await loadSubgroups();
    };

    // Business — save per-subgroup trigger distance
    const handleSaveDeptTrigger = async (sgid) => {
        await updateSubgroup(sgid, {CacheTriggerMeters: parseInt(editDeptTrigger) || 20});
        setEditingSGid(null);
        await loadSubgroups();
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
                    await loadSubgroups();
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
                <Text style={styles.body}>Create or join a game first.</Text>
            </Screen>
        );
    }

    // Filter subgroups for the department list (non-admin only)
    const departments = subgroupList.filter((sg) => !sg.IsAdminGroup);

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
                    <Text style={styles.codeLabel}>Player Join Code</Text>
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

                {/* Business: Departments / Subgroups management */}
                {isBusiness && (
                    <View style={styles.deptSection}>
                        <Text style={styles.sectionTitle}>Departments</Text>
                        {departments.map((sg) => (
                            <Card key={sg.SGid}>
                                <View style={styles.deptRow}>
                                    <View style={styles.deptInfo}>
                                        <Text style={styles.deptName}>{sg.SubGroupName}</Text>
                                        <Text style={styles.deptCode}>Join Code: {sg.JoinCode || '—'}</Text>
                                        <Text style={styles.deptTrigger}>Claim Distance: {sg.CacheTriggerMeters || 20}m</Text>
                                    </View>
                                    <View style={styles.deptActions}>
                                        <Button
                                            label="Edit"
                                            onClick={() => { setEditingSGid(sg.SGid); setEditDeptTrigger(String(sg.CacheTriggerMeters || 20)); }}
                                            styleButton={styles.deptEditButton}
                                            styleLabel={styles.deptBtnLabel}
                                        />
                                        <Button
                                            label="Delete"
                                            onClick={() => handleDeleteDepartment(sg)}
                                            styleButton={styles.deptDeleteButton}
                                            styleLabel={styles.deptBtnLabel}
                                        />
                                    </View>
                                </View>
                                {editingSGid === sg.SGid && (
                                    <View style={styles.deptEditRow}>
                                        <Text style={styles.label}>Claim Distance (metres)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={editDeptTrigger}
                                            onChangeText={setEditDeptTrigger}
                                            keyboardType="numeric"
                                            placeholder="20"
                                            placeholderTextColor="#9ca3af"
                                        />
                                        <ButtonTray>
                                            <Button
                                                label="Save"
                                                onClick={() => handleSaveDeptTrigger(sg.SGid)}
                                                styleButton={styles.deptSaveButton}
                                                styleLabel={styles.deptBtnLabel}
                                            />
                                            <Button
                                                label="Cancel"
                                                onClick={() => setEditingSGid(null)}
                                                styleButton={styles.deptCancelButton}
                                                styleLabel={styles.deptBtnLabel}
                                            />
                                        </ButtonTray>
                                    </View>
                                )}
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
                )}

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
    sectionTitle: {fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 16},
    label: {fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14},
    body: {color: '#4b5563', fontSize: 15},
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#1f2937',
        backgroundColor: '#ffffff',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    toggleLabel: {fontSize: 14, fontWeight: '600', color: '#374151'},
    codeSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
    },
    codeLabel: {fontSize: 14, fontWeight: '600', color: '#374151'},
    codeValue: {fontSize: 16, fontWeight: '700', color: '#2563eb', letterSpacing: 2},
    saveWrap: {marginTop: 24},
    saveButton: {backgroundColor: '#16a34a', borderColor: '#16a34a'},
    saveLabel: {color: '#ffffff', fontWeight: '600'},
    // Department / subgroup styles
    deptSection: {marginTop: 30},
    deptRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
    deptInfo: {flex: 1},
    deptName: {fontSize: 15, fontWeight: '700', color: '#1f2937'},
    deptCode: {fontSize: 13, fontWeight: '600', color: '#2563eb', marginTop: 2, letterSpacing: 1},
    deptTrigger: {fontSize: 12, color: '#6b7280', marginTop: 2},
    deptActions: {flexDirection: 'row', gap: 6},
    deptEditButton: {backgroundColor: '#2563eb', borderColor: '#2563eb', minHeight: 36, flex: 0, paddingHorizontal: 10},
    deptDeleteButton: {backgroundColor: '#dc2626', borderColor: '#dc2626', minHeight: 36, flex: 0, paddingHorizontal: 10},
    deptBtnLabel: {color: '#ffffff', fontWeight: '600', fontSize: 13},
    deptEditRow: {marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb'},
    deptSaveButton: {backgroundColor: '#16a34a', borderColor: '#16a34a'},
    deptCancelButton: {backgroundColor: '#6b7280', borderColor: '#6b7280'},
    createDeptRow: {flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center'},
    createDeptButton: {backgroundColor: '#16a34a', borderColor: '#16a34a', flex: 0, paddingHorizontal: 16},
    createDeptLabel: {color: '#ffffff', fontWeight: '600'},
    emptyText: {color: '#9ca3af', textAlign: 'center', marginTop: 10, fontSize: 14},
    // Admin waitlist styles
    waitlistSection: {marginTop: 30},
    waitlistRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    waitlistName: {fontSize: 15, fontWeight: '600', color: '#1f2937', flex: 1},
    waitlistActions: {flexDirection: 'row', gap: 6},
    approveButton: {backgroundColor: '#16a34a', borderColor: '#16a34a', minHeight: 36, flex: 0, paddingHorizontal: 10},
    approveBtnLabel: {color: '#ffffff', fontWeight: '600', fontSize: 13},
    rejectButton: {backgroundColor: '#dc2626', borderColor: '#dc2626', minHeight: 36, flex: 0, paddingHorizontal: 10},
    rejectBtnLabel: {color: '#ffffff', fontWeight: '600', fontSize: 13},
    // Reset game styles
    resetSection: {marginTop: 30},
    resetButton: {backgroundColor: '#dc2626', borderColor: '#dc2626'},
    resetLabel: {color: '#ffffff', fontWeight: '600'},
});

export default GameSettingsScreen;

