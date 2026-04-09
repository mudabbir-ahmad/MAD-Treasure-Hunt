import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import Screen from '../layout/Screen';
import {Button, ButtonTray} from '../UI/Button';
import useGameHook from '../../hooks/useGameHook';

const DepartmentSettingsScreen = ({route, navigation}) => {
  const {SGid, Gid} = route.params;
  const {getSubgroup, updateSubgroup, getCaches, resetGame} = useGameHook();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [teamsEnabled, setTeamsEnabled] = useState(false);
  const [cacheTriggerMeters, setCacheTriggerMeters] = useState('20');
  const [cacheCount, setCacheCount] = useState(0);

//   Handlers -------------------

  useEffect(() => {
    const load = async () => {
      const sg = await getSubgroup(SGid);
      if (sg) {
        setDeptName(sg.SubGroupName || '');
        setJoinCode(sg.JoinCode || '');
        setTeamsEnabled(Boolean(sg.TeamsEnabled));
        setCacheTriggerMeters(String(sg.CacheTriggerMeters || 20));
      }
      // Load cache count for this department
      const caches = await getCaches(Gid, SGid);
      setCacheCount((caches || []).length);
      setLoading(false);
    };
    load();
  }, []);

    const handleSave = async () => {
        setSaving(true);
        await updateSubgroup(SGid, {
            SubGroupName: deptName.trim(),
            TeamsEnabled: teamsEnabled,
            CacheTriggerMeters: parseInt(cacheTriggerMeters) || 20,
        });
        setSaving(false);
        Alert.alert('Saved', 'Department settings updated.');
    };

    const handleResetDepartment = () => {
        Alert.alert(
            'Reset Department',
            'This will reset all cache claims for this department. Are you sure?',
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        await resetGame(Gid, SGid);
                        Alert.alert('Done', 'Department progress has been reset.');
                    },
                },
            ],
        );
    };

    const handleManageCaches = () => {
        navigation.navigate('MapScreen', {
            selectedDepartmentSGid: SGid,
            selectedDepartmentName: deptName || null,
        });
    };

//   View -----------------------

    if (loading) {
        return (
            <Screen showBack={true} style={styles.center}>
                <ActivityIndicator size="large"/>
            </Screen>
        );
    }

    return (
        <Screen showBack={true}>
            <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Department Settings</Text>

                <Text style={styles.label}>Department Name</Text>
                <TextInput
                    style={styles.input}
                    value={deptName}
                    onChangeText={setDeptName}
                    placeholder="Enter department name"
                    placeholderTextColor="#9ca3af"
                />

                <View style={styles.codeSection}>
                    <Text style={styles.codeLabel}>Department Join Code</Text>
                    <Text style={styles.codeValue}>{joinCode || '—'}</Text>
                </View>

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

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Caches</Text>
                    <Text style={styles.infoValue}>{cacheCount}</Text>
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

                <View style={styles.mapWrap}>
                    <ButtonTray>
                        <Button
                            label="Manage Caches"
                            onClick={handleManageCaches}
                            styleButton={styles.mapButton}
                            styleLabel={styles.mapLabel}
                        />
                    </ButtonTray>
                </View>

                <View style={styles.resetWrap}>
                    <Button
                        label="Reset Department"
                        onClick={handleResetDepartment}
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
    codeValue: {fontSize: 16, fontWeight: '700', color: '#89b4fa', letterSpacing: 2},
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
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#313244',
        borderRadius: 8,
    },
    infoLabel: {fontSize: 14, fontWeight: '600', color: '#bac2de'},
    infoValue: {fontSize: 16, fontWeight: '700', color: '#cdd6f4'},
    saveWrap: {marginTop: 24},
    saveButton: {backgroundColor: '#a6e3a1', borderColor: '#a6e3a1'},
    saveLabel: {color: '#1e1e2e', fontWeight: '600'},
    mapWrap: {marginTop: 16},
    mapButton: {backgroundColor: '#89b4fa', borderColor: '#89b4fa'},
    mapLabel: {color: '#1e1e2e', fontWeight: '600'},
    resetWrap: {marginTop: 30},
    resetButton: {backgroundColor: '#f38ba8', borderColor: '#f38ba8'},
    resetLabel: {color: '#1e1e2e', fontWeight: '600'},
});

export default DepartmentSettingsScreen;

