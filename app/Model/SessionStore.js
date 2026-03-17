const session = {
  currentUid: null,
  currentGid: null,
  currentSGid: null,
  currentTGid: null,
  currentIsBusiness: null,
  currentIsAcceptedAdmin: false,
};

const setSessionUser = (user) => {
  session.currentUid = user?.Uid ?? null;
  session.currentGid = user?.Gid ?? null;
  session.currentSGid = user?.SGid ?? null;
  session.currentTGid = user?.TGid ?? null;
  session.currentIsBusiness = user?.isBusiness ?? null;
  session.currentIsAcceptedAdmin = Boolean(user?.IsAcceptedAdmin);
};

const setSessionGroup = (gid, sgid = null) => {
  session.currentGid = gid ?? null;
  if (sgid !== null && sgid !== undefined) {
    session.currentSGid = sgid;
  }
};

const setSessionMembership = ({ gid = null, sgid = null, isAcceptedAdmin = false } = {}) => {
  session.currentGid = gid;
  session.currentSGid = sgid;
  session.currentIsAcceptedAdmin = Boolean(isAcceptedAdmin);
};

const setSessionTeam = (tgid) => {
  session.currentTGid = tgid ?? null;
};

const getSession = () => ({ ...session });

export { setSessionUser, setSessionGroup, setSessionMembership, setSessionTeam, getSession };

// Default placeholder export to avoid Expo Router treating this non-component file as a route without a default.
export default function SessionStorePlaceholder() {
  return null;
}


