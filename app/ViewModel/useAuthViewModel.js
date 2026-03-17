import { useMemo, useState } from 'react';
import { loginUser, registerUser } from '../API/API';
import { setSessionUser } from '../Model/SessionStore';

const useAuthViewModel = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState('Individual');
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const canRegister = useMemo(
    () => Boolean(username && email && password && confirmPassword),
    [username, email, password, confirmPassword],
  );

  const login = async () => {
    setError('');
    try {
      const user = await loginUser(email.trim(), password);
      setCurrentUser(user);
      setSessionUser(user);
      return user;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  const register = async () => {
    setError('');
    try {
      const user = await registerUser({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        accountType,
      });
      setCurrentUser(user);
      setSessionUser(user);
      return user;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  return {
    email,
    password,
    username,
    confirmPassword,
    accountType,
    error,
    currentUser,
    canRegister,
    setEmail,
    setPassword,
    setUsername,
    setConfirmPassword,
    setAccountType,
    login,
    register,
  };
};

export default useAuthViewModel;

