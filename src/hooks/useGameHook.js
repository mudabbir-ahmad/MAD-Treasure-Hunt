import API, {API_BASE_URL} from '../components/API/API';

const useGameHook = () => {
  //   Initialisation ------------

  const usersEndpoint = `${API_BASE_URL}/users`;
  const gameTypesEndpoint = `${API_BASE_URL}/game-types`;
  const groupsEndpoint = `${API_BASE_URL}/groups`;
  const subgroupsEndpoint = `${API_BASE_URL}/subgroups`;
  const subgroupMembershipsEndpoint = `${API_BASE_URL}/subgroup-memberships`;
  const teamsEndpoint = `${API_BASE_URL}/teams`;
  const teamMembersEndpoint = `${API_BASE_URL}/team-members`;
  const gameDataEndpoint = `${API_BASE_URL}/game-data`;
  const adminWaitlistEndpoint = `${API_BASE_URL}/admin-waitlist`;

  //   Handlers -------------------

  // Users
  const getUser = async (uid) => {
    const response = await API.get(`${usersEndpoint}/${uid}`);
    return response.isSuccess ? response.result : null;
  };

  const updateUser = async (uid, data) => {
    const response = await API.put(`${usersEndpoint}/${uid}`, data);
    return response.isSuccess ? response.result : null;
  };

  // Game types
  const getGameTypes = async () => {
    const response = await API.get(gameTypesEndpoint);
    return response.isSuccess ? response.result : [];
  };

  // Groups
  const getCreatedPrivateGame = async (userId) => {
    const response = await API.get(`${groupsEndpoint}?CreatedByUid=${userId}`);
    return response.isSuccess ? response.result : [];
  };

  const createPrivateGame = async (payload) => {
    const response = await API.post(groupsEndpoint, payload);
    return response.isSuccess ? response.result : null;
  };

  const getLobby = async (gid) => {
    const response = await API.get(`${groupsEndpoint}/${gid}`);
    return response.isSuccess ? response.result : null;
  };

  const updateGroup = async (gid, data) => {
    const response = await API.put(`${groupsEndpoint}/${gid}`, data);
    return response.isSuccess ? response.result : null;
  };

  const getSubgroups = async (gid) => {
    const response = await API.get(`${subgroupsEndpoint}?Gid=${gid}`);
    return response.isSuccess ? response.result : [];
  };

  // Subgroup memberships
  const joinPrivateGame = async (payload) => {
    const response = await API.post(subgroupMembershipsEndpoint, payload);
    return response.isSuccess ? response.result : null;
  };

  const getGroupMembers = async (gid) => {
    const response = await API.get(`${subgroupMembershipsEndpoint}?Gid=${gid}`);
    return response.isSuccess ? response.result : [];
  };

  const joinAsAdmin = async (payload) => {
    const response = await API.post(adminWaitlistEndpoint, payload);
    return response.isSuccess ? response.result : null;
  };

  // Teams
  const getTeams = async (gid) => {
    const response = await API.get(`${teamsEndpoint}?Gid=${gid}`);
    return response.isSuccess ? response.result : [];
  };

  const getTeam = async (tid) => {
    const response = await API.get(`${teamsEndpoint}/${tid}`);
    return response.isSuccess ? response.result : null;
  };

  const createTeam = async (payload) => {
    const response = await API.post(teamsEndpoint, payload);
    return response.isSuccess ? response.result : null;
  };

  const joinTeamByCode = async (payload) => {
    const response = await API.post(teamMembersEndpoint, payload);
    return response.isSuccess ? response.result : null;
  };

  // Team members
  const getTeamMembers = async (tid) => {
    const response = await API.get(`${teamMembersEndpoint}?Tid=${tid}`);
    return response.isSuccess ? response.result : [];
  };

  const leaveTeam = async (membershipId) => {
    const response = await API.delete(`${teamMembersEndpoint}/${membershipId}`);
    return response.isSuccess;
  };

  // Caches
  const getCaches = async (gid, sgid = null) => {
    let url = `${gameDataEndpoint}/${gid}/caches`;
    if (sgid !== null) url += `?SGid=${sgid}`;
    const response = await API.get(url);
    return response.isSuccess ? response.result : [];
  };

  const upsertCache = async (payload) => {
    if (payload.cacheId) {
      const response = await API.put(
        `${gameDataEndpoint}/${payload.gid}/caches/${payload.cacheId}`,
        payload,
      );
      return response.isSuccess ? response.result : null;
    }
    const response = await API.post(
      `${gameDataEndpoint}/${payload.gid}/caches`,
      payload,
    );
    return response.isSuccess ? response.result : null;
  };

  const claimCache = async (payload) => {
    const response = await API.put(
      `${gameDataEndpoint}/${payload.gid}/caches/${payload.cacheId}`,
      {ClaimedByUid: payload.uid, ClaimedByTid: payload.tid},
    );
    return response.isSuccess ? response.result : null;
  };

  const deleteCache = async (gid, cacheId) => {
    const response = await API.delete(`${gameDataEndpoint}/${gid}/caches/${cacheId}`);
    return response.isSuccess;
  };

  //   Return ---------------------

  return {
    getUser,
    updateUser,
    getGameTypes,
    getCreatedPrivateGame,
    createPrivateGame,
    getLobby,
    updateGroup,
    getSubgroups,
    joinPrivateGame,
    joinAsAdmin,
    getGroupMembers,
    getTeams,
    getTeam,
    createTeam,
    joinTeamByCode,
    getTeamMembers,
    leaveTeam,
    getCaches,
    upsertCache,
    claimCache,
    deleteCache,
  };
};

export default useGameHook;

