import { useState } from 'react';
import { joinPrivateGame } from '../API/API';
import { getSession, setSessionGroup } from '../Model/SessionStore';

const usePrivateGameViewModel = () => {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const joinWithCode = async () => {
    setError('');
    try {
      const { currentUid } = getSession();
      const group = await joinPrivateGame({ userId: currentUid, joinCode: joinCode.trim().toUpperCase() });
      setSessionGroup(group.Gid);
      return group;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  return {
    joinCode,
    error,
    setJoinCode,
    joinWithCode,
  };
};

export default usePrivateGameViewModel;

