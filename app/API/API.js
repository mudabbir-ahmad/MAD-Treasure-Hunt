import dbController from '../Model/DbController';

const apiConfig = {
  useLocalDb: true,
  baseUrl: 'http://localhost:3000',
};

const setApiConfig = (nextConfig = {}) => {
  Object.assign(apiConfig, nextConfig);
};

const isSameId = (item, id) =>
  item.id?.toString() === id
  || item.Uid?.toString() === id
  || item.Gid?.toString() === id
  || item.SGid?.toString() === id
  || item.Tid?.toString() === id;

const normalize = (endpoint) => endpoint.replace(/^\/+/, '').split('/');

const localGet = (endpoint) => {
  const [resource, id] = normalize(endpoint);
  const state = dbController.getState();

  if (!resource) {
    return state;
  }
  if (!state[resource]) {
    throw new Error(`Resource not found: ${resource}`);
  }
  if (!id) {
    return state[resource];
  }
  return state[resource].find((item) => isSameId(item, id)) || null;
};

const localPost = (endpoint, payload) => {
  const [resource] = normalize(endpoint);

  if (resource === 'auth' && payload.action === 'login') {
    return dbController.login(payload.data);
  }
  if (resource === 'auth' && payload.action === 'register') {
    return dbController.register(payload.data);
  }
  if (resource === 'groups' && payload.action === 'joinPrivate') {
    return dbController.joinPrivateGame(payload.data);
  }
  if (resource === 'groups' && payload.action === 'joinAsAdmin') {
    return dbController.joinAsAdmin(payload.data);
  }
  if (resource === 'groups' && payload.action === 'createPrivate') {
    return dbController.createPrivateGame(payload.data);
  }
  if (resource === 'groups' && payload.action === 'requestAdmin') {
    return dbController.requestAdminApproval(payload.data);
  }
  if (resource === 'groups' && payload.action === 'approveAdmin') {
    return dbController.approveAdmin(payload.data);
  }
  if (resource === 'groups' && payload.action === 'createdByUser') {
    return dbController.getCreatedPrivateGameByUser(payload.data.userId);
  }
  if (resource === 'subgroups' && payload.action === 'create') {
    return dbController.createSubgroup(payload.data);
  }
  if (resource === 'teams' && payload.action === 'create') {
    return dbController.createTeam(payload.data);
  }
  if (resource === 'teams' && payload.action === 'join') {
    return dbController.joinTeamByCode(payload.data);
  }

  const state = dbController.getState();
  if (!state[resource]) {
    throw new Error(`Resource not found: ${resource}`);
  }
  state[resource].push(payload);
  return payload;
};

const localPut = (endpoint, payload) => {
  const [resource, id] = normalize(endpoint);
  const state = dbController.getState();
  if (!state[resource]) {
    throw new Error(`Resource not found: ${resource}`);
  }
  const index = state[resource].findIndex((item) =>
    isSameId(item, id),
  );
  if (index < 0) {
    throw new Error('Record not found');
  }
  state[resource][index] = { ...state[resource][index], ...payload };
  return state[resource][index];
};

const localDelete = (endpoint) => {
  const [resource, id] = normalize(endpoint);
  const state = dbController.getState();
  if (!state[resource]) {
    throw new Error(`Resource not found: ${resource}`);
  }
  const index = state[resource].findIndex((item) =>
    isSameId(item, id),
  );
  if (index < 0) {
    return { deleted: false };
  }
  state[resource].splice(index, 1);
  return { deleted: true };
};

const remoteRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${apiConfig.baseUrl}/${endpoint.replace(/^\/+/, '')}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
};

const APIFetch = async (endpoint) => {
  if (apiConfig.useLocalDb) {
    return localGet(endpoint);
  }
  return remoteRequest(endpoint, { method: 'GET' });
};

const APIPost = async (endpoint, data) => {
  if (apiConfig.useLocalDb) {
    return localPost(endpoint, data);
  }
  return remoteRequest(endpoint, { method: 'POST', body: JSON.stringify(data) });
};

const APIPut = async (endpoint, data) => {
  if (apiConfig.useLocalDb) {
    if (endpoint === 'groups/settings') {
      return dbController.updateGroupSettings(data);
    }
    if (endpoint === 'subgroups/cache') {
      return dbController.updateSubgroupCacheSettings(data);
    }
    return localPut(endpoint, data);
  }
  return remoteRequest(endpoint, { method: 'PUT', body: JSON.stringify(data) });
};

const APIDelete = async (endpoint) => {
  if (apiConfig.useLocalDb) {
    return localDelete(endpoint);
  }
  return remoteRequest(endpoint, { method: 'DELETE' });
};

const loginUser = async (email, password) => APIPost('auth', { action: 'login', data: { email, password } });
const registerUser = async (payload) => APIPost('auth', { action: 'register', data: payload });
const getGameTypes = async () => {
  if (apiConfig.useLocalDb) {
    return dbController.getGameTypes();
  }
  return APIFetch('game_types');
};
const joinPrivateGame = async (payload) => APIPost('groups', { action: 'joinPrivate', data: payload });
const joinAsAdmin = async (payload) => APIPost('groups', { action: 'joinAsAdmin', data: payload });
const createPrivateGame = async (payload) => APIPost('groups', { action: 'createPrivate', data: payload });
const getCreatedPrivateGame = async (userId) => APIPost('groups', { action: 'createdByUser', data: { userId } });
const requestAdminAccess = async (payload) => APIPost('groups', { action: 'requestAdmin', data: payload });
const approveAdminAccess = async (payload) => APIPost('groups', { action: 'approveAdmin', data: payload });
const createSubgroup = async (payload) => APIPost('subgroups', { action: 'create', data: payload });
const getSubgroups = async (gid) => {
  if (apiConfig.useLocalDb) {
    return dbController.getSubgroups(gid);
  }
  return APIFetch(`groups/${gid}/subgroups`);
};
const getVisibleSubgroups = async (gid) => {
  if (apiConfig.useLocalDb) {
    return dbController.getVisibleSubgroups(gid);
  }
  return APIFetch(`groups/${gid}/subgroups?visibleOnly=true`);
};
const updateSubgroupCache = async (payload) => APIPut('subgroups/cache', payload);
const updateGroupSettings = async (payload) => APIPut('groups/settings', payload);
const createTeam = async (payload) => APIPost('teams', { action: 'create', data: payload });
const joinTeam = async (payload) => APIPost('teams', { action: 'join', data: payload });
const getLobby = async (gid) => {
  if (apiConfig.useLocalDb) {
    return dbController.getLobby(gid);
  }
  return APIFetch(`groups/${gid}/lobby`);
};
const getTeam = async (tid) => {
  if (apiConfig.useLocalDb) {
    return dbController.getTeam(tid);
  }
  return APIFetch(`teams/${tid}`);
};
const getMapPoints = async (gid, sgid = null) => {
  if (apiConfig.useLocalDb) {
    return dbController.getMapPoints(gid, sgid);
  }
  if (sgid === null || sgid === undefined) {
    return APIFetch(`groups/${gid}/map`);
  }
  return APIFetch(`groups/${gid}/map/${sgid}`);
};

export {
  apiConfig,
  setApiConfig,
  APIFetch,
  APIPost,
  APIPut,
  APIDelete,
  loginUser,
  registerUser,
  getGameTypes,
  joinPrivateGame,
  joinAsAdmin,
  createPrivateGame,
  getCreatedPrivateGame,
  requestAdminAccess,
  approveAdminAccess,
  createSubgroup,
  getSubgroups,
  getVisibleSubgroups,
  updateSubgroupCache,
  updateGroupSettings,
  createTeam,
  joinTeam,
  getLobby,
  getTeam,
  getMapPoints,
};

// Default export to satisfy Expo Router route file requirement when the folder is scanned.
// This module primarily provides named exports; returning null as a component is safe
// and prevents the router warning about missing default export.
export default function APIPlaceholder() {
  return null;
}

