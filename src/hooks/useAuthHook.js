import {useState} from 'react';
import API, {API_BASE_URL} from '../components/API/API';
import {clearSession, setSessionUser} from './SessionStore';

const useAuthHook = () => {
  //   Initialisation ------------

  const loginEndpoint = `${API_BASE_URL}/auth/login`;
  const registerEndpoint = `${API_BASE_URL}/auth/register`;

  //   State ----------------------

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState('Individual');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  //   Handlers -------------------

  const login = async () => {
    setError('');
    setIsLoading(true);
    const response = await API.post(loginEndpoint, {
      email: email.trim(),
      password,
    });
    setIsLoading(false);
    if (response.isSuccess) {
      setSessionUser(response.result);
      return response.result;
    }
    setError(response.message);
    return null;
  };

  const register = async () => {
    setError('');
    setIsLoading(true);
    const response = await API.post(registerEndpoint, {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
      accountType,
    });
    setIsLoading(false);
    if (response.isSuccess) {
      setSessionUser(response.result);
      return response.result;
    }
    setError(response.message);
    return null;
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

  //   Return ---------------------

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

