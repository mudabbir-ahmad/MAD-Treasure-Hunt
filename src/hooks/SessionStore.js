import AsyncStorage from "@react-native-async-storage/async-storage";
import {GAME_MODE} from '../utils/gameConstants';

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
  currentGameMode: null,
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
  // New login/register starts in regular flow; global flow requires entering GLOBAL code.
  session.currentGlobalEventId = null;
  session.currentGlobalPlayerId = null;
  session.currentGameMode = user?.Gid ? GAME_MODE.REGULAR : null;
  persistSession();
};

const setSessionGroup = (gid, sgid = null) => {
  session.currentGid = gid ?? null;
  session.currentGameMode = gid ? GAME_MODE.REGULAR : session.currentGameMode;
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
  session.currentGameMode = eventId ? GAME_MODE.GLOBAL : session.currentGameMode;
  persistSession();
};

const setSessionMode = (mode) => {
  session.currentGameMode = mode ?? null;
  persistSession();
};

const clearGlobalSession = () => {
  session.currentGlobalEventId = null;
  session.currentGlobalPlayerId = null;
  if (!session.currentGid) session.currentGameMode = null;
  persistSession();
};

const clearSession = () => {
  session.currentUid = null;
  session.currentGid = null;
  session.currentSGid = null;
  session.currentTid = null;
  session.isBusiness = null;
  session.isAcceptedAdmin = false;
  session.currentGameMode = null;
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
  if (!session.currentGlobalEventId) session.currentGameMode = null;
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
  setPendingAdmin,
  setSelectedCache,
  getSession,
  clearSession,
  clearGameSession,
  loadSession,
  setGlobalSession,
  clearGlobalSession,
  setSessionMode,
};
