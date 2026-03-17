import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useAuthViewModel from '../ViewModel/useAuthViewModel';
import ScreenHeader from '../components/ScreenHeader';

const RegisterPage = () => {
  const navigation = useNavigation();
  const {
    username,
    email,
    password,
    confirmPassword,
    accountType,
    error,
    setUsername,
    setEmail,
    setPassword,
    setConfirmPassword,
    setAccountType,
    register,
  } = useAuthViewModel();
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    setSubmitting(true);
    const user = await register();
    setSubmitting(false);
    if (!user) {
      return;
    }
    navigation.navigate(user.SGid === 0 ? '(routes)/admin-hub' : '(routes)/game-type');
  };

  return (
    <View style={styles.wrapper}>
      <ScreenHeader title="Register" />
      <View style={styles.container}>
        <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeButton, accountType === 'Individual' && styles.typeButtonActive]}
            onPress={() => setAccountType('Individual')}
          >
            <Text style={[styles.typeText, accountType === 'Individual' && styles.typeTextActive]}>Individual</Text>
          </Pressable>
          <Pressable
            style={[styles.typeButton, accountType === 'Business/School' && styles.typeButtonActive]}
            onPress={() => setAccountType('Business/School')}
          >
            <Text style={[styles.typeText, accountType === 'Business/School' && styles.typeTextActive]}>Business/School</Text>
          </Pressable>
        </View>
        <Pressable style={styles.submitButton} onPress={handleRegister}>
          <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create Account'}</Text>
        </Pressable>
        <View style={styles.errorSlot}>
          <Text style={[styles.errorText, !error && styles.errorHidden]}>{error || ' '}</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('(routes)/login')}>
          <Text style={styles.backText}>Back to Login</Text>
        </Pressable>
      </View>
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
    justifyContent: 'center',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  typeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  submitText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  backText: {
    textAlign: 'center',
    color: '#2563eb',
    fontWeight: '600',
  },
  errorSlot: {
    minHeight: 20,
    justifyContent: 'center',
  },
  errorText: {
    textAlign: 'center',
    color: '#dc2626',
  },
  errorHidden: {
    opacity: 0,
  },
});

export default RegisterPage;
