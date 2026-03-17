import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import useSubgroupAdminViewModel from '../ViewModel/useSubgroupAdminViewModel';
import AdminFooterNavbar from '../components/AdminFooterNavbar';
import ScreenHeader from '../components/ScreenHeader';

const ManageSubgroupsPage = () => {
  const {
    subgroups,
    subgroupName,
    cacheTriggerMeters,
    error,
    setSubgroupName,
    setCacheTriggerMeters,
    addSubgroup,
    updateCacheForSubgroup,
  } = useSubgroupAdminViewModel();

  return (
    <View style={styles.wrapper}>
      <ScreenHeader title="Manage Subgroups" />
      <View style={styles.container}>
        {subgroups.map((subgroup) => (
          <View key={`${subgroup.Gid}_${subgroup.SGid}`} style={styles.row}>
            <Text style={styles.rowText}>
              SGid {subgroup.SGid} | {subgroup.SubGroupName} | Code: {subgroup.JoinCode || 'ADMIN'} | Trigger: {subgroup.CacheTriggerMeters}m
            </Text>
            <Pressable
              style={styles.inlineButton}
              onPress={() => updateCacheForSubgroup(subgroup.SGid, (subgroup.CacheTriggerMeters || 20) + 5)}
            >
              <Text style={styles.inlineButtonText}>+5m</Text>
            </Pressable>
          </View>
        ))}
        <TextInput
          style={styles.input}
          placeholder="New subgroup name"
          value={subgroupName}
          onChangeText={setSubgroupName}
        />
        <TextInput
          style={styles.input}
          placeholder="Cache trigger meters"
          keyboardType="numeric"
          value={cacheTriggerMeters}
          onChangeText={setCacheTriggerMeters}
        />
        <Pressable style={styles.button} onPress={addSubgroup}>
          <Text style={styles.buttonText}>Create Subgroup</Text>
        </Pressable>
        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>
      <AdminFooterNavbar />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    gap: 10,
    padding: 20,
  },
  row: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  rowText: {
    color: '#111827',
    fontSize: 13,
  },
  inlineButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inlineButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  errorText: {
    color: '#dc2626',
  },
});

export default ManageSubgroupsPage;

