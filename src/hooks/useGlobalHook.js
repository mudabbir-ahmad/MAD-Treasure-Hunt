import API from "../components/API/API";

const GLOBAL_BASE = process.env.EXPO_PUBLIC_GLOBAL_API_BASE;
const GLOBAL_KEY = process.env.EXPO_PUBLIC_GLOBAL_API_KEY;

// Appends the API key as a query param to any URL
const withKey = (url) => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}key=${GLOBAL_KEY}`;
};

const useGlobalHook = () => {
  // Initialisations ---------------------

  const eventsEndpoint = `${GLOBAL_BASE}/api/events`;
  const playersEndpoint = `${GLOBAL_BASE}/api/players`;
  const cachesEndpoint = `${GLOBAL_BASE}/api/caches`;
  const findsEndpoint = `${GLOBAL_BASE}/api/finds`;
  const usersEndpoint = `${GLOBAL_BASE}/api/users`;

  // Handlers ----------------------------

  // Events
  const getPublicEvents = async () => {
    const response = await API.get(withKey(eventsEndpoint));
    if (!response.isSuccess) return [];
    return response.result.filter((e) => e.EventIspublic);
  };

  const getEvent = async (eventId) => {
    const response = await API.get(withKey(`${eventsEndpoint}/${eventId}`));
    return response.isSuccess ? response.result : null;
  };

  // Players
  const getPlayersByEvent = async (eventId) => {
    const response = await API.get(
      withKey(`${playersEndpoint}/events/${eventId}`),
    );
    return response.isSuccess ? response.result : [];
  };

  const joinEvent = async (data) => {
    const response = await API.post(withKey(playersEndpoint), data);
    return response.isSuccess ? response.result : null;
  };

  // Caches
  const getCachesByEvent = async (eventId) => {
    const response = await API.get(
      withKey(`${cachesEndpoint}/events/${eventId}`),
    );
    return response.isSuccess ? response.result : [];
  };

  const getCache = async (cacheId) => {
    const response = await API.get(withKey(`${cachesEndpoint}/${cacheId}`));
    return response.isSuccess ? response.result : null;
  };

  // Finds
  const getFindsByEvent = async (eventId) => {
    const response = await API.get(
      withKey(`${findsEndpoint}/events/${eventId}`),
    );
    return response.isSuccess ? response.result : [];
  };

  const getFindsByPlayer = async (playerId) => {
    const response = await API.get(
      withKey(`${findsEndpoint}/players/${playerId}`),
    );
    return response.isSuccess ? response.result : [];
  };

  const logFind = async (data) => {
    const response = await API.post(withKey(findsEndpoint), data);
    return response.isSuccess ? response.result : null;
  };

  // Users
  const getUser = async (userId) => {
    const response = await API.get(withKey(`${usersEndpoint}/${userId}`));
    return response.isSuccess ? response.result : null;
  };

  // Return --------------------------------

  return {
    getPublicEvents,
    getEvent,
    getPlayersByEvent,
    joinEvent,
    getCachesByEvent,
    getCache,
    getFindsByEvent,
    getFindsByPlayer,
    logFind,
    getUser,
  };
};

export default useGlobalHook;
