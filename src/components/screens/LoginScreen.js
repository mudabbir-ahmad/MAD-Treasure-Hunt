import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import useAuthHook from '../../hooks/useAuthHook';
import Screen from '../layout/Screen';
import {Button, ButtonTray} from '../UI/Button';

const LoginScreen = ({ navigation }) => {
  const { email, password, error, isLoading, setEmail, setPassword, login } = useAuthHook();
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setSubmitting(true);
    const user = await login();
    setSubmitting(false);
    if (!user) {
      return;
    }
    if (user.IsAcceptedAdmin) {
      navigation.reset({ index: 0, routes: [{ name: 'Admin' }] });
      return;
    }
    navigation.reset({ index: 0, routes: [{ name: 'Game' }] });
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Login</Text>

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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ButtonTray>
          <Button
            label={submitting ? 'Logging in...' : 'Login'}
            onClick={handleLogin}
            styleButton={styles.submitButton}
            styleLabel={styles.submitText}
          />
        </ButtonTray>

        <Pressable onPress={() => navigation.navigate('Auth', { screen: 'RegisterScreen' })}>
          <Text style={styles.linkText}>Create new account</Text>
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
    gap: 15,
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

export default LoginScreen;
