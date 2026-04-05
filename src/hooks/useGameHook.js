import API, {API_BASE_URL} from '../components/API/API';

const useGameHook = () => {
  //   Initialisation ------------

  const gameTypesEndpoint = `${API_BASE_URL}/game-types`;
  const groupsEndpoint = `${API_BASE_URL}/groups`;
  const subgroupMembershipsEndpoint = `${API_BASE_URL}/subgroup-memberships`;
  const teamsEndpoint = `${API_BASE_URL}/teams`;
  const teamMembersEndpoint = `${API_BASE_URL}/team-members`;
  const gameDataEndpoint = `${API_BASE_URL}/game-data`;
  const adminWaitlistEndpoint = `${API_BASE_URL}/admin-waitlist`;

  //   Handlers -------------------

  const getGameTypes = async () => {
    const response = await API.get(gameTypesEndpoint);
    return response.isSuccess ? response.result : [];
  };

  const getCreatedPrivateGame = async (userId) => {
    const response = await API.get(`${groupsEndpoint}?CreatedByUid=${userId}`);
    return response.isSuccess ? response.result : [];
  };

  const createPrivateGame = async (payload) => {
    const response = await API.post(groupsEndpoint, payload);
    return response.isSuccess ? response.result : null;
  };

  const joinPrivateGame = async (payload) => {
    const response = await API.post(subgroupMembershipsEndpoint, payload);
    return response.isSuccess ? response.result : null;
  };

  const joinAsAdmin = async (payload) => {
    const response = await API.post(adminWaitlistEndpoint, payload);
    return response.isSuccess ? response.result : null;
  };

  const getLobby = async (gid) => {
    const response = await API.get(`${groupsEndpoint}/${gid}`);
    return response.isSuccess ? response.result : null;
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

  //   Return ---------------------

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
    getCaches,
    upsertCache,
    claimCache,
  };
};

export default useGameHook;

