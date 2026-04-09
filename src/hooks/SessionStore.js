// --- Session Store (with AsyncStorage persistence) ---

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@mad_session";

const session = {
  currentUid: null,
  currentGid: null,
  currentSGid: null,
  currentTid: null,
  isBusiness: null,
  isAcceptedAdmin: false,
  isPendingAdmin: false,
  teamsEnabled: false,
  // Global gameplay
  currentGlobalEventId: null,
  currentGlobalPlayerId: null,
  selectedCacheId: null,
};

// --- Handlers ---

const setSessionUser = (user) => {
  session.currentUid = user?.Uid ?? null;
  session.currentGid = user?.Gid ?? null;
  session.currentSGid = user?.SGid ?? null;
  session.currentTid = user?.TGid ?? null;
  session.isBusiness = user?.isBusiness ?? null;
  session.isAcceptedAdmin = Boolean(user?.IsAcceptedAdmin);
  session.isPendingAdmin = Boolean(
    user?.isBusiness && user?.Gid && !user?.SGid && !user?.IsAcceptedAdmin,
  );
  persistSession();
};

const setSessionGroup = (gid, sgid = null) => {
  session.currentGid = gid ?? null;
  if (sgid !== undefined) {
    session.currentSGid = sgid ?? null;
  }
  persistSession();
};

const setSessionTeam = (tid) => {
  session.currentTid = tid ?? null;
  persistSession();
};

const setSessionTeamsEnabled = (val) => {
  session.teamsEnabled = Boolean(val);
  persistSession();
};

const setPendingAdmin = (val) => {
  session.isPendingAdmin = Boolean(val);
  persistSession();
};

const setSelectedCache = (cacheId) => {
  session.selectedCacheId = cacheId ?? null;
  persistSession();
};

const getSession = () => ({ ...session });

const setGlobalSession = (eventId, playerId) => {
  session.currentGlobalEventId = eventId ?? null;
  session.currentGlobalPlayerId = playerId ?? null;
  persistSession();
};

const clearGlobalSession = () => {
  session.currentGlobalEventId = null;
  session.currentGlobalPlayerId = null;
  persistSession();
};

const clearSession = () => {
  session.currentUid = null;
  session.currentGid = null;
  session.currentSGid = null;
  session.currentTid = null;
  session.isBusiness = null;
  session.isAcceptedAdmin = false;
  session.currentGlobalEventId = null;
  session.currentGlobalPlayerId = null;
  session.isPendingAdmin = false;
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
};

// Clear game data but keep user logged in
const clearGameSession = () => {
  session.currentGid = null;
  session.currentSGid = null;
  session.currentTid = null;
  session.isAcceptedAdmin = false;
  session.isPendingAdmin = false;
  session.teamsEnabled = false;
  session.selectedCacheId = null;
  persistSession();
};

// --- Persistence helpers ---

const persistSession = () => {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session)).catch(() => {});
};

const loadSession = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      Object.assign(session, saved);
    }
  } catch (_) {
    // Ignore read errors — start fresh
  }
  return { ...session };
};

export {
  setSessionUser,
  setSessionGroup,
  setSessionTeam,
  setSessionTeamsEnabled,
  getSession,
  clearSession,
  clearGameSession,
  loadSession,
  setGlobalSession,
  clearGlobalSession,
};
export { setSessionUser, setSessionGroup, setSessionTeam, setSessionTeamsEnabled, setPendingAdmin, setSelectedCache, getSession, clearSession, clearGameSession, loadSession };
