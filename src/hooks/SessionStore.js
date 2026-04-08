// --- Session Store (with AsyncStorage persistence) ---

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mad_session';

const session = {
  currentUid: null,
  currentGid: null,
  currentSGid: null,
  currentTid: null,
  isBusiness: null,
  isAcceptedAdmin: false,
  teamsEnabled: false,
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
  persistSession();
};

const setSessionGroup = (gid, sgid = null) => {
  session.currentGid = gid ?? null;
  if (sgid !== null && sgid !== undefined) {
    session.currentSGid = sgid;
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

const setSelectedCache = (cacheId) => {
  session.selectedCacheId = cacheId ?? null;
  persistSession();
};

const getSession = () => ({ ...session });

const clearSession = () => {
  session.currentUid = null;
  session.currentGid = null;
  session.currentSGid = null;
  session.currentTid = null;
  session.isBusiness = null;
  session.isAcceptedAdmin = false;
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
};

// Clear game data but keep user logged in
const clearGameSession = () => {
  session.currentGid = null;
  session.currentSGid = null;
  session.currentTid = null;
  session.isAcceptedAdmin = false;
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

export { setSessionUser, setSessionGroup, setSessionTeam, setSessionTeamsEnabled, setSelectedCache, getSession, clearSession, clearGameSession, loadSession };
