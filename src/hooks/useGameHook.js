import API, {API_BASE_URL} from '../components/API/API';

const useGameHook = () => {
  //   Initialisation ------------

  const usersEndpoint = `${API_BASE_URL}/users`;
  const groupsEndpoint = `${API_BASE_URL}/groups`;
  const subgroupsEndpoint = `${API_BASE_URL}/subgroups`;
  const subgroupMembersEndpoint = `${API_BASE_URL}/subgroup-members`;
  const teamsEndpoint = `${API_BASE_URL}/teams`;
  const teamMembersEndpoint = `${API_BASE_URL}/team-members`;
  const cachesEndpoint = `${API_BASE_URL}/caches`;
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

  // Groups
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

  // Look up a group by its Organisation Join Code
  const getGroupByOrgCode = async (code) => {
    const response = await API.get(`${groupsEndpoint}?OrgJoinCode=${code}`);
    if (response.isSuccess && response.result.length > 0) return response.result[0];
    return null;
  };

  // Subgroups
  const getSubgroups = async (gid) => {
    const response = await API.get(`${subgroupsEndpoint}?Gid=${gid}`);
    return response.isSuccess ? response.result : [];
  };

  const getSubgroup = async (sgid) => {
    const response = await API.get(`${subgroupsEndpoint}/${sgid}`);
    return response.isSuccess ? response.result : null;
  };

  const createSubgroup = async (payload) => {
    const response = await API.post(subgroupsEndpoint, payload);
    return response.isSuccess ? response.result : null;
  };

  const updateSubgroup = async (sgid, data) => {
    const response = await API.put(`${subgroupsEndpoint}/${sgid}`, data);
    return response.isSuccess ? response.result : null;
  };

  const deleteSubgroup = async (sgid) => {
    const response = await API.delete(`${subgroupsEndpoint}/${sgid}`);
    return response.isSuccess;
  };

  // Subgroup members
  const joinPrivateGame = async (payload) => {
    const response = await API.post(subgroupMembersEndpoint, payload);
    return response.isSuccess ? response.result : null;
  };

  const getGroupMembers = async (gid) => {
    const response = await API.get(`${subgroupMembersEndpoint}?Gid=${gid}`);
    return response.isSuccess ? response.result : [];
  };

  const removeMember = async (membershipId) => {
    const response = await API.delete(`${subgroupMembersEndpoint}/${membershipId}`);
    return response.isSuccess;
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

  const updateTeam = async (tid, data) => {
    const response = await API.put(`${teamsEndpoint}/${tid}`, data);
    return response.isSuccess ? response.result : null;
  };

  const deleteTeam = async (tid) => {
    const response = await API.delete(`${teamsEndpoint}/${tid}`);
    return response.isSuccess;
  };

  const disbandTeams = async (gid) => {
    const response = await API.post(`${teamsEndpoint}/disband?Gid=${gid}`, {});
    return response.isSuccess;
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

  const getCaches = async (gid, sgid = null) => {
    let url = `${cachesEndpoint}?Gid=${gid}`;
    if (sgid !== null) url += `&SGid=${sgid}`;
    const response = await API.get(url);
    return response.isSuccess ? response.result : [];
  };

  const upsertCache = async (payload) => {
    const data = {
      Gid: payload.gid,
      SGid: payload.subgroupId,
      Title: payload.name,
      Clue: payload.clue,
      Latitude: payload.latitude,
      Longitude: payload.longitude,
      TriggerMeters: payload.radius,
    };
    if (payload.cacheId) {
      const response = await API.put(`${cachesEndpoint}/${payload.cacheId}`, data);
      return response.isSuccess ? response.result : null;
    }
    const response = await API.post(cachesEndpoint, data);
    return response.isSuccess ? response.result : null;
  };

  const claimCache = async (payload) => {
    const response = await API.post(
      `${cachesEndpoint}/${payload.cacheId}/claim`,
      {Uid: payload.uid, Tid: payload.tid},
    );
    return response.isSuccess ? response.result : null;
  };

  const deleteCache = async (gid, cacheId) => {
    const response = await API.delete(`${cachesEndpoint}/${cacheId}`);
    return response.isSuccess;
  };

  // Game reset — remove all caches for a game
  const resetGame = async (gid) => {
    const response = await API.post(`${cachesEndpoint}/reset?Gid=${gid}`, {});
    return response.isSuccess;
  };

  // Player progress reset — clear all claims by a specific user
  const resetPlayerProgress = async (gid, uid) => {
    const response = await API.post(`${cachesEndpoint}/reset-player/${uid}?Gid=${gid}`, {});
    return response.isSuccess;
  };

  const resetTeamProgress = async (gid, tid) => {
    const response = await API.post(`${cachesEndpoint}/reset-team/${tid}?Gid=${gid}`, {});
    return response.isSuccess;
  };

  // Admin waitlist
  const getAdminWaitlist = async (gid, uid = null) => {
    let url = `${adminWaitlistEndpoint}?Gid=${gid}`;
    if (uid !== null) url += `&Uid=${uid}`;
    const response = await API.get(url);
    return response.isSuccess ? response.result : [];
  };

  const approveAdmin = async (waitlistId) => {
    const response = await API.post(`${adminWaitlistEndpoint}/${waitlistId}/approve`, {});
    return response.isSuccess ? response.result : null;
  };

  const rejectAdmin = async (waitlistId) => {
    const response = await API.delete(`${adminWaitlistEndpoint}/${waitlistId}`);
    return response.isSuccess;
  };

  //   Return ---------------------

  return {
    getUser,
    updateUser,
    createPrivateGame,
    getLobby,
    updateGroup,
    getGroupByOrgCode,
    getSubgroups,
    getSubgroup,
    createSubgroup,
    updateSubgroup,
    deleteSubgroup,
    joinPrivateGame,
    getGroupMembers,
    removeMember,
    getTeams,
    getTeam,
    createTeam,
    updateTeam,
    deleteTeam,
    disbandTeams,
    joinTeamByCode,
    getTeamMembers,
    leaveTeam,
    getCaches,
    upsertCache,
    claimCache,
    deleteCache,
    resetGame,
    resetPlayerProgress,
    resetTeamProgress,
    getAdminWaitlist,
    approveAdmin,
    rejectAdmin,
  };
};

export default useGameHook;

