const session = {
  currentUid: null,
  currentGid: null,
  currentSGid: null,
  currentTGid: null,
};

const setSessionUser = (user) => {
  session.currentUid = user?.Uid ?? null;
  session.currentGid = user?.Gid ?? null;
  session.currentSGid = user?.SGid ?? null;
  session.currentTGid = user?.TGid ?? null;
};

const setSessionGroup = (gid, sgid = null) => {
  session.currentGid = gid ?? null;
  if (sgid !== null && sgid !== undefined) {
    session.currentSGid = sgid;
  }
};

const setSessionTeam = (tgid) => {
  session.currentTGid = tgid ?? null;
};

const getSession = () => ({ ...session });

export { setSessionUser, setSessionGroup, setSessionTeam, getSession };


