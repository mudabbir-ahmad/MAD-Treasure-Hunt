import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

const useLoginLogic = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      return false;
    }

    if (email.trim().toLowerCase().includes('admin')) {
      navigation.navigate('(routes)/admin-hub');
      return true;
    }

    navigation.navigate('(routes)/game-type');
    return true;
  };

  return {
    email,
    password,
    setEmail,
    setPassword,
    handleLogin,
  };
};

export default useLoginLogic;
