import {postDb} from './dbLink';

const useGameHook = () => {
  const request = async (action, payload = {}) => postDb(action, payload);

  const getGameTypes = async () => request('getGameTypes');

  const getCreatedPrivateGame = async (userId) => request('getCreatedPrivateGameByUser', { userId });

  const createPrivateGame = async (payload) => request('createPrivateGame', payload);

  const joinPrivateGame = async (payload) => request('joinPrivateGame', payload);

  const joinAsAdmin = async (payload) => request('joinAsAdmin', payload);

  const getLobby = async (gid) => request('getLobby', { gid });

  const getTeam = async (tid) => request('getTeam', { tid });

  const createTeam = async (payload) => request('createTeam', payload);

  const joinTeamByCode = async (payload) => request('joinTeamByCode', payload);

  const getMapPoints = async (gid, sgid = null) => request('getMapPoints', { gid, sgid });

  const getCaches = async (gid, sgid = null) => request('getCaches', { gid, sgid });

  const upsertCache = async (payload) => request('upsertCache', payload);

  const claimCache = async (payload) => request('claimCache', payload);

  return {
    getGameTypes,
    getCreatedPrivateGame,
    createPrivateGame,
    joinPrivateGame,
    joinAsAdmin,
    getLobby,
    getTeam,
    createTeam,
    joinTeamByCode,
    getMapPoints,
    getCaches,
    upsertCache,
    claimCache,
  };
};

export default useGameHook;

