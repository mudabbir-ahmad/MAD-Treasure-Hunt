import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useManagePrivateSubtaskViewModel from '../ViewModel/useManagePrivateSubtaskViewModel';

const ManagePrivateSubtaskPage = () => {
  const navigation = useNavigation();
  const {
    businessOrSchoolName,
    error,
    setBusinessOrSchoolName,
    createNewPrivateGame,
    joinAdminForPrivate,
  } = useManagePrivateSubtaskViewModel();
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    setSubmitting(true);
    const group = await createNewPrivateGame();
    setSubmitting(false);
    if (!group) {
      return;
    }
    navigation.navigate('admin-hub');
  };

  const handleJoinAdmin = async () => {
    setSubmitting(true);
    const response = await joinAdminForPrivate();
    setSubmitting(false);
    if (!response) {
      return;
    }
    navigation.navigate('admin-hub');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Private Game</Text>
      <TextInput
        style={styles.input}
        placeholder="Business/School Name"
        value={businessOrSchoolName}
        onChangeText={setBusinessOrSchoolName}
      />
      <Pressable style={styles.primaryButton} onPress={handleCreate}>
        <Text style={styles.buttonText}>{submitting ? 'Please wait...' : 'Create New Private Game'}</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={handleJoinAdmin}>
        <Text style={styles.buttonText}>Join as Admin for Private Game</Text>
      </Pressable>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButton: {
    backgroundColor: '#4b5563',
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

export default ManagePrivateSubtaskPage;

