import { useCallback, useMemo } from "react";
import API from "../components/API/API";
import globalApiConfig from "../components/API/api.json";

const GLOBAL_BASE = String(
  process.env.EXPO_PUBLIC_GLOBAL_API_BASE ||
    globalApiConfig.GLOBAL_API_BASE_URL ||
    "",
).trim();
const GLOBAL_KEY = String(
  process.env.EXPO_PUBLIC_GLOBAL_API_KEY ||
    globalApiConfig.GLOBAL_API_KEY ||
    "",
).trim();
const DEFAULT_GLOBAL_PROFILE_IMAGE_URL =
  String(globalApiConfig.DEFAULT_GLOBAL_PROFILE_IMAGE_URL || "").trim() ||
  "https://placehold.co/256x256/png";

const isGlobalApiReady = () => Boolean(GLOBAL_BASE);

// Appends the API key as a query param when provided.
const withKey = (url) => {
  if (!GLOBAL_KEY) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}key=${encodeURIComponent(GLOBAL_KEY)}`;
};

const unwrapList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.value)) return payload.value;
  if (Array.isArray(payload.Value)) return payload.Value;
  return [];
};

const unwrapSingle = (payload) => {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  if (Array.isArray(payload.value)) return payload.value[0] || null;
  if (Array.isArray(payload.Value)) return payload.Value[0] || null;
  if (payload.value && typeof payload.value === "object") return payload.value;
  if (payload.Value && typeof payload.Value === "object") return payload.Value;
  return typeof payload === "object" ? payload : null;
};

const randomToken = (size = 6) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < size; i += 1) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

const firstNonEmpty = (...values) => {
  for (const value of values) {
    const normalized = String(value || "").trim();
    if (normalized) return normalized;
  }
  return "";
};

const withMinLength = (value, min, fallback) => {
  const normalized = firstNonEmpty(value);
  if (normalized.length >= min) return normalized;
  return fallback;
};

const splitUsername = (username) => {
  const cleaned = String(username || "").trim();
  if (!cleaned) return { first: "Global", last: "User" };
  const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 1) {
    return { first: parts[0], last: "User" };
  }
  return {
    first: parts[0],
    last: parts.slice(1).join(" "),
  };
};

const buildGlobalUserPayload = (userId, privateUser = null) => {
  const privateUsername = firstNonEmpty(privateUser?.username);
  const nameParts = splitUsername(privateUsername);
  const firstName = firstNonEmpty(
    privateUser?.firstName,
    nameParts.first,
    "Global",
  );
  const syncedUsername = `${firstName}_${userId}`;

  return {
    UserID: userId,
    UserFirstname: firstName,
    UserLastname: firstNonEmpty(privateUser?.lastName, nameParts.last, "User"),
    // The live global API validates phone length >= 12.
    UserPhone: withMinLength(privateUser?.phone, 12, "000000000000"),
    UserUsername: syncedUsername,
    // The live global API validates password length >= 8.
    UserPassword: withMinLength(
      privateUser?.passwordHash,
      8,
      `PW_${randomToken(10)}`,
    ),
    UserLatitude: Number((Math.random() * 180 - 90).toFixed(6)),
    UserLongitude: Number((Math.random() * 360 - 180).toFixed(6)),
    UserTimestamp: Date.now(),
    UserImageURL: firstNonEmpty(
      privateUser?.imageUrl,
      DEFAULT_GLOBAL_PROFILE_IMAGE_URL,
    ),
  };
};

const useGlobalHook = () => {
  // Initialisations ---------------------

  const endpoints = useMemo(
    () => ({
      events: `${GLOBAL_BASE}/api/events`,
      players: `${GLOBAL_BASE}/api/players`,
      caches: `${GLOBAL_BASE}/api/caches`,
      finds: `${GLOBAL_BASE}/api/finds`,
      users: `${GLOBAL_BASE}/api/users`,
    }),
    [],
  );

  // Handlers ----------------------------

  // Events
  const getPublicEvents = useCallback(async () => {
    if (!isGlobalApiReady()) return [];
    const response = await API.get(withKey(endpoints.events));
    if (!response.isSuccess) return [];
    const rows = unwrapList(response.result);
    return rows.filter((e) => e.EventIspublic);
  }, [endpoints.events]);

  const getEvent = useCallback(
    async (eventId) => {
      if (!isGlobalApiReady()) return null;
      const response = await API.get(withKey(`${endpoints.events}/${eventId}`));
      if (!response.isSuccess) return null;
      return unwrapSingle(response.result);
    },
    [endpoints.events],
  );

  // Players
  const getPlayersByEvent = useCallback(
    async (eventId) => {
      if (!isGlobalApiReady()) return [];
      const response = await API.get(
        withKey(`${endpoints.players}/events/${eventId}`),
      );
      if (!response.isSuccess) return [];
      return unwrapList(response.result);
    },
    [endpoints.players],
  );

  const joinEvent = useCallback(
    async (data) => {
      if (!isGlobalApiReady()) return null;
      const response = await API.post(withKey(endpoints.players), data);
      if (!response.isSuccess) return null;
      return unwrapSingle(response.result);
    },
    [endpoints.players],
  );

  // Caches
  const getCachesByEvent = useCallback(
    async (eventId) => {
      if (!isGlobalApiReady()) return [];
      const response = await API.get(
        withKey(`${endpoints.caches}/events/${eventId}`),
      );
      if (!response.isSuccess) return [];
      return unwrapList(response.result);
    },
    [endpoints.caches],
  );

  const getCache = useCallback(
    async (cacheId) => {
      if (!isGlobalApiReady()) return null;
      const response = await API.get(withKey(`${endpoints.caches}/${cacheId}`));
      if (!response.isSuccess) return null;
      return unwrapSingle(response.result);
    },
    [endpoints.caches],
  );

  // Finds
  const getFindsByEvent = useCallback(
    async (eventId) => {
      if (!isGlobalApiReady()) return [];
      const response = await API.get(
        withKey(`${endpoints.finds}/events/${eventId}`),
      );
      if (!response.isSuccess) return [];
      return unwrapList(response.result);
    },
    [endpoints.finds],
  );

  const getFindsByPlayer = useCallback(
    async (playerId) => {
      if (!isGlobalApiReady()) return [];
      const response = await API.get(
        withKey(`${endpoints.finds}/players/${playerId}`),
      );
      if (!response.isSuccess) return [];
      return unwrapList(response.result);
    },
    [endpoints.finds],
  );

  const logFind = useCallback(
    async (data) => {
      if (!isGlobalApiReady()) return null;
      const response = await API.post(withKey(endpoints.finds), data);
      if (!response.isSuccess) return null;
      return unwrapSingle(response.result) || { ...data };
    },
    [endpoints.finds],
  );

  const claimCache = useCallback(
    async (playerId, cache) => {
      if (!isGlobalApiReady() || !playerId || !cache) return null;
      const response = await API.post(withKey(endpoints.finds), {
        FindPlayerID: playerId,
        FindCacheID: cache.CacheID,
        FindDatetime: new Date().toISOString(),
        FindImageURL: cache.CacheImageURL || DEFAULT_GLOBAL_PROFILE_IMAGE_URL,
      });
      if (!response.isSuccess)
        return { error: response.message || "Unknown error" };
      const find = unwrapSingle(response.result) || {
        FindPlayerID: playerId,
        FindCacheID: cache.CacheID,
      };
      return { find, points: Number(cache.CachePoints ?? 0) };
    },
    [endpoints.finds],
  );

  // Users
  const getUsers = useCallback(async () => {
    if (!isGlobalApiReady()) return [];
    const response = await API.get(withKey(endpoints.users));
    if (!response.isSuccess) return [];
    return unwrapList(response.result);
  }, [endpoints.users]);

  const getUser = useCallback(
    async (userId) => {
      if (!isGlobalApiReady()) return null;
      // Some global API deployments expose list-only user routes.
      const byIdResponse = await API.get(
        withKey(`${endpoints.users}/${userId}`),
      );
      if (byIdResponse.isSuccess) {
        const single = unwrapSingle(byIdResponse.result);
        if (single) return single;
      }
      const users = await getUsers();
      return (
        users.find((user) => String(user.UserID) === String(userId)) || null
      );
    },
    [endpoints.users, getUsers],
  );

  const createUser = useCallback(
    async (payload) => {
      if (!isGlobalApiReady()) return null;
      const response = await API.post(withKey(endpoints.users), payload);
      if (!response.isSuccess) return null;
      return unwrapSingle(response.result);
    },
    [endpoints.users],
  );

  const updateUser = useCallback(
    async (userId, payload) => {
      if (!isGlobalApiReady()) return null;
      const response = await API.put(
        withKey(`${endpoints.users}/${userId}`),
        payload,
      );
      if (!response.isSuccess) return null;
      return unwrapSingle(response.result) || payload;
    },
    [endpoints.users],
  );

  // Only called by Join Global Game flow to mirror a private user into global API schema.
  const ensureGlobalUser = useCallback(
    async (userId, privateUser = null) => {
      if (!userId || !isGlobalApiReady()) return null;

      const seed = buildGlobalUserPayload(userId, privateUser);

      // Primary lookup by deterministic username bridge.
      const users = await getUsers();
      const bySyncedUsername = users.find(
        (user) => String(user.UserUsername) === String(seed.UserUsername),
      );
      if (bySyncedUsername) return bySyncedUsername;

      const existing = await getUser(userId);
      if (existing) return existing;

      const created = await createUser(seed);
      if (created) return created;

      // Final fallback: check list endpoint again after attempted creation.
      const refreshed = await getUsers();
      return (
        refreshed.find(
          (user) => String(user.UserUsername) === String(seed.UserUsername),
        ) ||
        refreshed.find((user) => String(user.UserID) === String(userId)) ||
        null
      );
    },
    [createUser, getUser, getUsers],
  );

  // Return --------------------------------

  return {
    isGlobalApiReady,
    defaultGlobalProfileImageUrl: DEFAULT_GLOBAL_PROFILE_IMAGE_URL,
    getPublicEvents,
    getEvent,
    getPlayersByEvent,
    joinEvent,
    getCachesByEvent,
    getCache,
    getFindsByEvent,
    getFindsByPlayer,
    logFind,
    claimCache,
    getUser,
    createUser,
    updateUser,
    ensureGlobalUser,
  };
};

export default useGlobalHook;
