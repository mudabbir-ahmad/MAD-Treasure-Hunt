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
    const {getLobby, updateGroup, getSubgroups, resetGame, getAdminWaitlist, approveAdmin, rejectAdmin, getUser} = useGameHook();
    const isBusiness = Boolean(session.isBusiness);

//   State ----------------------

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [teamsEnabled, setTeamsEnabled] = useState(session.teamsEnabled);
    const [maxSubgroups, setMaxSubgroups] = useState('1');
    const [cacheTriggerMeters, setCacheTriggerMeters] = useState('20');
    const [adminJoinCode, setAdminJoinCode] = useState('');
    const [memberJoinCode, setMemberJoinCode] = useState('');
    const [waitlist, setWaitlist] = useState([]);
    const [waitlistNames, setWaitlistNames] = useState({});

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
                setMaxSubgroups(String(group.MaxMemberSubgroups || 1));
                setCacheTriggerMeters(String(group.CacheTriggerMeters || 20));
                setAdminJoinCode(group.AdminJoinCode || '');
            }
            const sgs = await getSubgroups(session.currentGid);
            const memberSg = (sgs || []).find((sg) => !sg.IsAdminGroup);
            if (memberSg) setMemberJoinCode(memberSg.JoinCode || '');
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
            MaxMemberSubgroups: parseInt(maxSubgroups) || 1,
            CacheTriggerMeters: parseInt(cacheTriggerMeters) || 20,
        });
        // Persist the new toggle value so the session reflects it after a reload
        if (result) setSessionTeamsEnabled(teamsEnabled);
        setSaving(false);
    };

    const handleResetGame = () => {
        Alert.alert('Reset Entire Game', 'This will clear ALL cache claims for every player. Are you sure?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Reset',
                style: 'destructive',
                onPress: async () => {
                    await resetGame(session.currentGid);
                    Alert.alert('Done', 'All cache claims have been reset.');
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

                {isBusiness && (
                    <>
                        <Text style={styles.label}>Max Member Subgroups</Text>
                        <TextInput
                            style={styles.input}
                            value={maxSubgroups}
                            onChangeText={setMaxSubgroups}
                            keyboardType="numeric"
                            placeholder="1"
                            placeholderTextColor="#9ca3af"
                        />
                    </>
                )}

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

