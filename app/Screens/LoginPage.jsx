import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useAuthViewModel from '../ViewModel/useAuthViewModel';

const LoginPage = () => {
  const navigation = useNavigation();
  const {
    email,
    password,
    error,
    setEmail,
    setPassword,
    login,
  } = useAuthViewModel();
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setSubmitting(true);
    const user = await login();
    setSubmitting(false);
    if (!user) {
      return;
    }
    if (user.SGid === 0) {
      navigation.navigate('admin-hub');
      return;
    }
    navigation.navigate('game-type');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.row}>
        <Pressable style={styles.leftButton} onPress={() => navigation.navigate('register')}>
          <Text style={styles.buttonText}>Register</Text>
        </Pressable>
        <Pressable style={styles.rightButton} onPress={handleLogin}>
          <Text style={styles.buttonText}>{submitting ? 'Logging in...' : 'Login'}</Text>
        </Pressable>
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  leftButton: {
    flex: 1,
    backgroundColor: '#4b5563',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  rightButton: {
    flex: 1,
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
    marginTop: 4,
  },
});

export default LoginPage;

