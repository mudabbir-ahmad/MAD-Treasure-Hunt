import { useState } from 'react';
import { createPrivateGame, joinAsAdmin } from '../API/API';
import { getSession, setSessionGroup } from '../Model/SessionStore';

const useManagePrivateSubtaskViewModel = () => {
  const [businessOrSchoolName, setBusinessOrSchoolName] = useState('');
  const [error, setError] = useState('');

  const createNewPrivateGame = async () => {
    setError('');
    const { currentUid } = getSession();
    try {
      const group = await createPrivateGame({
        userId: currentUid,
        groupName: businessOrSchoolName.trim() || 'New Private Game',
        businessOrSchoolName: businessOrSchoolName.trim() || 'Unnamed Business',
        isBusiness: true,
      });
      setSessionGroup(group.Gid, 0);
      return group;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  const joinAdminForPrivate = async () => {
    setError('');
    const { currentUid } = getSession();
    try {
      const response = await joinAsAdmin({
        userId: currentUid,
        businessOrSchoolName: businessOrSchoolName.trim(),
      });
      const gid = response?.Gid ?? null;
      if (gid !== null) {
        setSessionGroup(gid, 0);
      }
      return response;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  return {
    businessOrSchoolName,
    error,
    setBusinessOrSchoolName,
    createNewPrivateGame,
    joinAdminForPrivate,
  };
};

export default useManagePrivateSubtaskViewModel;

