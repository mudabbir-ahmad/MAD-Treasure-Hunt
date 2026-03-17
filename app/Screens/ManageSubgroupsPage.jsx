import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import useSubgroupAdminViewModel from '../ViewModel/useSubgroupAdminViewModel';
import AdminFooterNavbar from '../components/AdminFooterNavbar';
import ScreenHeader from '../components/ScreenHeader';
import EntityCard from '../components/UI/EntityCard';
import SearchBar from '../components/UI/SearchBar';
import {getSession} from '../Model/SessionStore';

const ManageSubgroupsPage = () => {
  const {
    filteredSubgroups,
    searchQuery,
    subgroupName,
    cacheTriggerMeters,
    error,
    setSearchQuery,
    setSubgroupName,
    setCacheTriggerMeters,
    addSubgroup,
    updateCacheForSubgroup,
  } = useSubgroupAdminViewModel();
  const { currentIsBusiness } = getSession();

  if (!currentIsBusiness) {
    return (
      <View style={styles.wrapper}>
        <ScreenHeader title="Manage Subgroups" />
        <View style={styles.container}>
          <Text style={styles.message}>
            Subgroups are managed automatically for individual accounts.
          </Text>
        </View>
        <AdminFooterNavbar />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScreenHeader title="Manage Subgroups" />
      <View style={styles.container}>
        <Pressable style={styles.createButton} onPress={addSubgroup}>
          <Text style={styles.createButtonText}>+ Create Subgroup</Text>
        </Pressable>
        <SearchBar
          placeholder="Search by name or ID"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView style={styles.cardList} showsVerticalScrollIndicator={false}>
          {filteredSubgroups.length === 0 && (
            <Text style={styles.emptyText}>
              {searchQuery ? 'No subgroups match your search.' : 'No subgroups yet. Create one to get started.'}
            </Text>
          )}
          {filteredSubgroups.map((subgroup) => (
            <EntityCard
              key={`${subgroup.Gid}_${subgroup.SGid}`}
              title={subgroup.SubGroupName}
              subtitle={`ID: ${subgroup.SGid}`}
              metaLabel1="Status"
              metaValue1={subgroup.IsGameStarted ? 'Active' : 'Inactive'}
              metaLabel2="Teams"
              metaValue2={String(true)}
              onPress={() => {
                updateCacheForSubgroup(subgroup.SGid, (subgroup.CacheTriggerMeters || 20) + 5);
              }}
            />
          ))}
        </ScrollView>
        <View style={styles.createForm}>
          <Text style={styles.formTitle}>Create New Subgroup</Text>
          <TextInput
            style={styles.input}
            placeholder="Subgroup name"
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
          <Pressable style={styles.submitButton} onPress={addSubgroup}>
            <Text style={styles.submitButtonText}>Create</Text>
          </Pressable>
        </View>
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
    padding: 20,
    flexDirection: 'column',
  },
  message: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 15,
  },
  createButton: {
    backgroundColor: '#2563eb',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  cardList: {
    flex: 1,
    gap: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 20,
  },
  createForm: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    marginTop: 12,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  submitButton: {
    backgroundColor: '#4b5563',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  errorText: {
    color: '#dc2626',
    marginTop: 8,
  },
});

export default ManageSubgroupsPage;

