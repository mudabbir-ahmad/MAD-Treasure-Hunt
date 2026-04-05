// --- Session Store ---

const session = {
  currentUid: null,
  currentGid: null,
  currentSGid: null,
  currentTid: null,
  isBusiness: null,
  isAcceptedAdmin: false,
};

// --- Handlers ---

const setSessionUser = (user) => {
  session.currentUid = user?.Uid ?? null;
  session.currentGid = user?.Gid ?? null;
  session.currentSGid = user?.SGid ?? null;
  session.currentTid = user?.TGid ?? null;
  session.isBusiness = user?.isBusiness ?? null;
  session.isAcceptedAdmin = Boolean(user?.IsAcceptedAdmin);
};

const setSessionGroup = (gid, sgid = null) => {
  session.currentGid = gid ?? null;
  if (sgid !== null && sgid !== undefined) {
    session.currentSGid = sgid;
  }
};

const setSessionTeam = (tid) => {
  session.currentTid = tid ?? null;
};

const getSession = () => ({ ...session });

const clearSession = () => {
  session.currentUid = null;
  session.currentGid = null;
  session.currentSGid = null;
  session.currentTid = null;
  session.isBusiness = null;
  session.isAcceptedAdmin = false;
};

export { setSessionUser, setSessionGroup, setSessionTeam, getSession, clearSession };
