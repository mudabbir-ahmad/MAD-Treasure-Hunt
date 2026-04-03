import {useState} from 'react';
import {postDb} from './dbLink';
import {clearSession, setSessionUser} from './SessionStore';

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
      const user = await postDb('login', { email: email.trim(), password });
      setSessionUser(user);
      setIsLoading(false);
      return user;
    } catch (e) {
      setError(e.message);
      setIsLoading(false);
      return null;
    }
  };

  const register = async () => {
    setError('');
    setIsLoading(true);
    try {
      const user = await postDb('register', {
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
      setError(e.message);
      setIsLoading(false);
      return null;
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

