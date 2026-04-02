import dbController from './DbController';

const useGameHook = () => {
  const getGameTypes = () => dbController.getGameTypes();

  const getCreatedPrivateGame = (userId) => {
    return dbController.getCreatedPrivateGameByUser(userId);
  };

  const createPrivateGame = (payload) => {
    return dbController.createPrivateGame(payload);
  };

  const joinPrivateGame = (payload) => {
    return dbController.joinPrivateGame(payload);
  };

  const joinAsAdmin = (payload) => {
    return dbController.joinAsAdmin(payload);
  };

  const getLobby = (gid) => {
    return dbController.getLobby(gid);
  };

  const getTeam = (tid) => {
    return dbController.getTeam(tid);
  };

  const createTeam = (payload) => {
    return dbController.createTeam(payload);
  };

  const joinTeamByCode = (payload) => {
    return dbController.joinTeamByCode(payload);
  };

  const getMapPoints = (gid, sgid = null) => {
    return dbController.getMapPoints(gid, sgid);
  };

  const getCaches = (gid, sgid = null) => {
    return dbController.getCaches(gid, sgid);
  };

  const upsertCache = (payload) => {
    return dbController.upsertCache(payload);
  };

  const claimCache = (payload) => {
    return dbController.claimCache(payload);
  };

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

