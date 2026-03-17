import {useState} from 'react';
import {createPrivateGame, getCreatedPrivateGame, joinAsAdmin} from '../API/API';
import {getSession, setSessionMembership} from '../Model/SessionStore';

const useManagePrivateSubtaskViewModel = () => {
  const [businessOrSchoolName, setBusinessOrSchoolName] = useState('');
  const [error, setError] = useState('');

  const isBusinessUser = Boolean(getSession().currentIsBusiness);

  const findExistingPrivateGame = async () => {
    const { currentUid } = getSession();
    if (!currentUid) {
      return null;
    }
    return getCreatedPrivateGame(currentUid);
  };

  const createNewPrivateGame = async () => {
    setError('');
    const { currentUid } = getSession();
    try {
      const group = await createPrivateGame({
        userId: currentUid,
        groupName: businessOrSchoolName.trim() || 'New Private Game',
        businessOrSchoolName: businessOrSchoolName.trim() || 'Unnamed Business',
        isBusiness: isBusinessUser,
      });

      if (isBusinessUser) {
        setSessionMembership({ gid: group.Gid, sgid: 0, isAcceptedAdmin: true });
      } else {
        setSessionMembership({ gid: group.Gid, sgid: 1, isAcceptedAdmin: false });
      }

      return group;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  const resolveIndividualPrivateRoute = async () => {
    setError('');
    try {
      const existingGroup = await findExistingPrivateGame();
      if (existingGroup) {
        setSessionMembership({ gid: existingGroup.Gid, sgid: 1, isAcceptedAdmin: false });
        return '(routes)/manage-game';
      }

      const created = await createNewPrivateGame();
      if (!created) {
        return null;
      }
      return '(routes)/create-game';
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
        setSessionMembership({ gid, sgid: 0, isAcceptedAdmin: !response.queued });
      }
      if (response?.queued) {
        setError('Admin access request submitted. You will see admin tools after approval.');
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
    isBusinessUser,
    setBusinessOrSchoolName,
    createNewPrivateGame,
    resolveIndividualPrivateRoute,
    joinAdminForPrivate,
  };
};

export default useManagePrivateSubtaskViewModel;

