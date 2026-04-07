import React, {useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import Screen from '../layout/Screen';
import {Button, ButtonTray} from '../UI/Button';
import useGameHook from '../../hooks/useGameHook';
import {getSession} from '../../hooks/SessionStore';

const GameSettingsScreen = () => {
//   Initialisation ------------

    const session = getSession();
    const {getLobby, updateGroup, getSubgroups} = useGameHook();
    const isBusiness = Boolean(session.isBusiness);

//   State ----------------------

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [teamsEnabled, setTeamsEnabled] = useState(false);
    const [maxSubgroups, setMaxSubgroups] = useState('1');
    const [adminJoinCode, setAdminJoinCode] = useState('');
    const [memberJoinCode, setMemberJoinCode] = useState('');

//   Handlers -------------------

    useEffect(() => {
        const load = async () => {
            if (!session.currentGid) {
                setLoading(false);
                return;
            }
            const group = await getLobby(session.currentGid);
            if (group) {
                setGroupName(group.GroupName || '');
                setTeamsEnabled(Boolean(group.TeamsEnabled));
                setMaxSubgroups(String(group.MaxMemberSubgroups || 1));
                setAdminJoinCode(group.AdminJoinCode || '');
            }
            const sgs = await getSubgroups(session.currentGid);
            const memberSg = (sgs || []).find((sg) => !sg.IsAdminGroup);
            if (memberSg) setMemberJoinCode(memberSg.JoinCode || '');
            setLoading(false);
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!session.currentGid) return;
        setSaving(true);
        await updateGroup(session.currentGid, {
            GroupName: groupName.trim(),
            TeamsEnabled: teamsEnabled,
            MaxMemberSubgroups: parseInt(maxSubgroups) || 1,
        });
        setSaving(false);
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
});

export default GameSettingsScreen;

