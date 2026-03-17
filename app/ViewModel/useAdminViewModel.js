import {
  approveAdminAccess,
  createPrivateGame,
  requestAdminAccess,
  updateGroupSettings,
} from '../API/API';
import { getSession, setSessionGroup } from '../Model/SessionStore';

const useAdminViewModel = () => {
  const createGame = async (payload) => {
    const { currentUid } = getSession();
    const group = await createPrivateGame({ ...payload, userId: currentUid });
    setSessionGroup(group.Gid, 0);
    return group;
  };
  const requestAdmin = async (payload) => requestAdminAccess(payload);
  const approveAdmin = async (payload) => approveAdminAccess(payload);
  const setTeamsEnabled = async (gid, teamsEnabled) => updateGroupSettings({ gid, teamsEnabled });

  return {
    createGame,
    requestAdmin,
    approveAdmin,
    setTeamsEnabled,
  };
};

export default useAdminViewModel;

