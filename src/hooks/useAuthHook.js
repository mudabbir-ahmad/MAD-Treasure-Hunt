import {useState} from 'react';
import Constants from 'expo-constants';
import dbController from './DbController';
import {clearSession, setSessionUser} from './SessionStore';

const hostFromExpo = Constants.expoConfig?.hostUri?.split(':')[0] || null;
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || (hostFromExpo ? `http://${hostFromExpo}:3000` : 'http://localhost:3000');

const postJson = async (path, payload) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Request failed');
  }
  return result;
};

const useAuthHook = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState('Individual');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
    setError('');
    setIsLoading(true);
    try {
      const user = await postJson('/auth/login', { email: email.trim(), password });
      setSessionUser(user);
      setIsLoading(false);
      return user;
    } catch (e) {
      try {
        const fallbackUser = dbController.login({ email: email.trim(), password });
        setSessionUser(fallbackUser);
        setIsLoading(false);
        return fallbackUser;
      } catch {
        setError(e.message);
        setIsLoading(false);
        return null;
      }
    }
  };

  const register = async () => {
    setError('');
    setIsLoading(true);
    try {
      const user = await postJson('/auth/register', {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        accountType,
      });
      setSessionUser(user);
      setIsLoading(false);
      return user;
    } catch (e) {
      try {
        const fallbackUser = dbController.register({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
          accountType,
        });
        setSessionUser(fallbackUser);
        setIsLoading(false);
        return fallbackUser;
      } catch {
        setError(e.message);
        setIsLoading(false);
        return null;
      }
    }
  };

  const logout = () => {
    clearSession();
    setEmail('');
    setPassword('');
    setUsername('');
    setConfirmPassword('');
    setAccountType('Individual');
    setError('');
  };

  return {
    email,
    password,
    username,
    confirmPassword,
    accountType,
    error,
    isLoading,
    setEmail,
    setPassword,
    setUsername,
    setConfirmPassword,
    setAccountType,
    login,
    register,
    logout,
  };
};

export default useAuthHook;

