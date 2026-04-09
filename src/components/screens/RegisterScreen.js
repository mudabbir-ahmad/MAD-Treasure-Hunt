import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import useAuthHook from '../../hooks/useAuthHook';
import Screen from '../layout/Screen';
import {Button, ButtonTray} from '../UI/Button';

const RegisterScreen = ({navigation}) => {
  const {
    username, email, password, confirmPassword, accountType,
    error, isLoading,
    setUsername, setEmail, setPassword, setConfirmPassword, setAccountType,
    register,
  } = useAuthHook();

  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    setSubmitting(true);
    const user = await register();
    setSubmitting(false);
    if (!user) return;
    const rootNav = navigation.getParent() || navigation;
    if (user.IsAcceptedAdmin) {
      rootNav.reset({index: 0, routes: [{name: 'Admin'}]});
      return;
    }
    rootNav.reset({index: 0, routes: [{name: 'Game'}]});
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#6c7086"
          value={username}
          onChangeText={setUsername}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6c7086"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6c7086"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#6c7086"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isLoading}
        />

        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeButton, accountType === 'Individual' && styles.typeButtonActive]}
            onPress={() => setAccountType('Individual')}
            disabled={isLoading}
          >
            <Text style={[styles.typeText, accountType === 'Individual' && styles.typeTextActive]}>
              Individual
            </Text>
          </Pressable>
          <Pressable
            style={[styles.typeButton, accountType === 'Business/School' && styles.typeButtonActive]}
            onPress={() => setAccountType('Business/School')}
            disabled={isLoading}
          >
            <Text style={[styles.typeText, accountType === 'Business/School' && styles.typeTextActive]}>
              Business
            </Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ButtonTray>
          <Button
            label={submitting ? 'Creating...' : 'Create Account'}
            onClick={handleRegister}
            styleButton={styles.submitButton}
            styleLabel={styles.submitText}
          />
        </ButtonTray>

        <Pressable onPress={() => navigation.navigate('LoginScreen')}>
          <Text style={styles.linkText}>Back to Login</Text>
        </Pressable>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  content: {
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#cdd6f4',
  },
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
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#45475a',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  typeButtonActive: {
    backgroundColor: '#bd93f9',
    borderColor: '#bd93f9',
  },
  typeText: {
    color: '#bac2de',
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#1e1e2e',
  },
  errorText: {
    color: '#D92800',
    textAlign: 'center',
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#bd93f9',
    borderColor: '#bd93f9',
  },
  submitText: {
    color: '#1e1e2e',
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    color: '#bd93f9',
    fontWeight: '600',
    paddingVertical: 10,
  },
});

export default RegisterScreen;
