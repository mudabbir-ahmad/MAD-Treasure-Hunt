import buildDbLink from './dbLink';

class DbController {
  constructor(db = buildDbLink()) {
    this.db = db;
  }

  hashPassword(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return `H_${Math.abs(hash)}`;
  }

  toMinuteIso(date = new Date()) {
    return `${date.toISOString().slice(0, 16)}Z`;
  }

  generateJoinCode(length = 5) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i += 1) {
      code += charset[Math.floor(Math.random() * charset.length)];
    }
    return code;
  }

  generateUniqueJoinCode(collection, key) {
    let code = this.generateJoinCode(Math.random() > 0.5 ? 5 : 6);
    while (collection.some((item) => item[key] === code)) {
      code = this.generateJoinCode(Math.random() > 0.5 ? 5 : 6);
    }
    return code;
  }

  nextId(counterKey) {
    const keyToCollection = {
      user: { collection: 'users', field: 'Uid' },
      group: { collection: 'groups', field: 'Gid' },
      team: { collection: 'teams', field: 'Tid' },
    };

    const config = keyToCollection[counterKey];
    if (!config) {
      throw new Error(`Unsupported counter key: ${counterKey}`);
    }

    const rows = this.db[config.collection] || [];
    const maxId = rows.reduce((max, row) => {
      const value = Number(row[config.field] || 0);
      return value > max ? value : max;
    }, 0);

    return maxId + 1;
  }

  getUserByEmail(email) {
    return this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  getUserById(uid) {
    return this.db.users.find((u) => u.Uid === Number(uid)) || null;
  }

  getGroupById(gid) {
    return this.db.groups.find((group) => group.Gid === Number(gid)) || null;
  }

  register(payload) {
    const { username, email, password, confirmPassword, accountType } = payload;

    if (!username || !email || !password || !confirmPassword) {
      throw new Error('Missing required registration fields');
    }
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
    if (this.getUserByEmail(email)) {
      throw new Error('Email already in use');
    }

    const uid = this.nextId('user');
    const user = {
      Uid: uid,
      username,
      email,
      passwordHash: this.hashPassword(password),
      isBusiness: accountType === 'Business/School',
      IsAcceptedAdmin: false,
      Gid: null,
      SGid: null,
      TGid: null,
    };

    this.db.users.push(user);
    return user;
  }

  login(payload) {
    const { email, password } = payload;
    const user = this.getUserByEmail(email);
    if (!user) {
      throw new Error('Email not found');
    }
    const incomingHash = this.hashPassword(password);
    if (incomingHash !== user.passwordHash) {
      throw new Error('Invalid password');
    }
    return user;
  }

  getGameTypes() {
    return this.db.game_types;
  }

  getSubgroupByJoinCode(joinCode) {
    return this.db.subgroups.find(
      (subgroup) => subgroup.JoinCode && subgroup.JoinCode === joinCode.toUpperCase(),
    ) || null;
  }

  ensureMembership(uid, gid, sgid, isAcceptedAdmin) {
    const existing = this.db.subgroup_memberships.find(
      (membership) => membership.Uid === uid && membership.Gid === gid,
    );

    if (existing) {
      existing.SGid = sgid;
      existing.IsAcceptedAdmin = isAcceptedAdmin;
      return existing;
    }

    const membership = {
      Uid: uid,
      Gid: gid,
      SGid: sgid,
      IsAcceptedAdmin: isAcceptedAdmin,
    };
    this.db.subgroup_memberships.push(membership);
    return membership;
  }

  ensureGroupGameData(gid) {
    const existing = this.db.game_data.find((entry) => entry.Gid === gid);
    if (existing) {
      return existing;
    }
    const payload = { Gid: gid, GeoCaches: [] };
    this.db.game_data.push(payload);
    return payload;
  }

  hasActiveAdmin(gid) {
    return this.db.subgroup_memberships.some(
      (membership) => membership.Gid === gid && membership.SGid === 0 && membership.IsAcceptedAdmin,
    );
  }

  canJoinTeamForSubgroup(group, sgid) {
    return group.TeamsEnabled && sgid > 0;
  }

  createPrivateGame(payload) {
    const { userId, groupName, businessOrSchoolName, gameType = 'private', isBusiness = false } = payload;

    const user = this.getUserById(Number(userId));
    if (!user) {
      throw new Error('User not found');
    }

    const existing = this.db.groups.find(
      (group) => group.CreatedByUid === Number(userId) && group.GameType === 'private',
    );
    if (existing) {
      return existing;
    }

    const gid = this.nextId('group');
    const isBusinessGroup = Boolean(isBusiness);
    const group = {
      Gid: gid,
      GroupName: groupName,
      BusinessOrSchoolName: businessOrSchoolName || groupName,
      GameType: gameType,
      AdminJoinCode: this.generateUniqueJoinCode(this.db.groups, 'AdminJoinCode'),
      CreatedByUid: user.Uid,
      MaxMemberSubgroups: isBusinessGroup ? 999 : 1,
      TeamsEnabled: true,
      IsBusinessGroup: isBusinessGroup,
      ApprovedAdmins: isBusinessGroup ? [user.Uid] : [],
      CreatedAt: this.toMinuteIso(),
    };

    this.db.groups.push(group);
    this.ensureGroupGameData(gid);

    this.db.subgroups.push({
      SGid: 0,
      SubGroupName: 'Admins',
      Gid: group.Gid,
      JoinCode: null,
      IsAdminGroup: true,
      IsGameStarted: false,
      CacheTriggerMeters: 20,
    });

    if (!isBusinessGroup) {
      const memberSGid = this.db.subgroups.filter((sg) => sg.Gid === gid).length;
      this.db.subgroups.push({
        SGid: memberSGid,
        SubGroupName: 'Members',
        Gid: gid,
        JoinCode: this.generateUniqueJoinCode(this.db.subgroups, 'JoinCode'),
        IsAdminGroup: false,
        IsGameStarted: false,
        CacheTriggerMeters: 20,
      });
    }

    const ownerSgid = isBusinessGroup ? 0 : 1;
    this.ensureMembership(user.Uid, gid, ownerSgid, isBusinessGroup);
    user.Gid = gid;
    user.SGid = ownerSgid;
    user.IsAcceptedAdmin = isBusinessGroup;

    return group;
  }

  joinPrivateGame(payload) {
    const { userId, joinCode } = payload;
    const user = this.getUserById(Number(userId));
    const subgroup = this.getSubgroupByJoinCode(joinCode);

    if (!user || !subgroup || subgroup.IsAdminGroup) {
      throw new Error('Invalid subgroup join code');
    }

    const group = this.getGroupById(subgroup.Gid);
    if (!group) {
      throw new Error('Group not found');
    }

    this.ensureMembership(user.Uid, subgroup.Gid, subgroup.SGid, false);
    user.Gid = group.Gid;
    user.SGid = subgroup.SGid;
    user.IsAcceptedAdmin = false;
    return group;
  }

  joinAsAdmin(payload) {
    const { userId, adminJoinCode } = payload;
    const user = this.getUserById(Number(userId));
    const group = this.db.groups.find((g) => g.AdminJoinCode === adminJoinCode);

    if (!user || !group) {
      throw new Error('Invalid admin join code or user not found');
    }

    if (this.hasActiveAdmin(group.Gid)) {
      this.db.admin_waitlist.push({
        Uid: user.Uid,
        Gid: group.Gid,
        RequestedAt: this.toMinuteIso(),
      });
      return { status: 'pending', message: 'Admin approval pending' };
    }

    group.ApprovedAdmins.push(user.Uid);
    this.ensureMembership(user.Uid, group.Gid, 0, true);
    user.Gid = group.Gid;
    user.SGid = 0;
    user.IsAcceptedAdmin = true;

    return { status: 'approved', group };
  }

  getCreatedPrivateGameByUser(uid) {
    return this.db.groups.find(
      (group) => group.CreatedByUid === Number(uid) && group.GameType === 'private',
    ) || null;
  }

  createSubgroup(payload) {
    const { gid, subgroupName, cacheTriggerMeters = 20 } = payload;
    const group = this.getGroupById(gid);
    if (!group) {
      throw new Error('Group not found');
    }

    const existingCount = this.db.subgroups.filter((sg) => sg.Gid === gid).length;
    if (existingCount >= group.MaxMemberSubgroups + 1) {
      throw new Error('Max subgroups reached');
    }

    const sgid = existingCount;
    const newSubgroup = {
      SGid: sgid,
      SubGroupName: subgroupName,
      Gid: gid,
      JoinCode: this.generateUniqueJoinCode(this.db.subgroups, 'JoinCode'),
      IsAdminGroup: false,
      IsGameStarted: false,
      CacheTriggerMeters: cacheTriggerMeters,
    };

    this.db.subgroups.push(newSubgroup);
    return newSubgroup;
  }

  getSubgroups(gid) {
    return this.db.subgroups.filter((sg) => sg.Gid === gid);
  }

  getVisibleSubgroups(gid) {
    return this.db.subgroups.filter((sg) => sg.Gid === gid && sg.SGid > 0);
  }

  updateSubgroupCacheSettings(payload) {
    const { gid, sgid, cacheTriggerMeters } = payload;
    const subgroup = this.db.subgroups.find((sg) => sg.Gid === gid && sg.SGid === sgid);
    if (!subgroup) {
      throw new Error('Subgroup not found');
    }
    subgroup.CacheTriggerMeters = cacheTriggerMeters;
    return subgroup;
  }

  createTeam(payload) {
    const { gid, sgid, teamName, leaderId } = payload;
    const tid = this.nextId('team');
    const team = {
      Tid: tid,
      Gid: gid,
      SGid: sgid,
      TeamName: teamName,
      LeaderId: leaderId,
      JoinCode: this.generateUniqueJoinCode(this.db.teams, 'JoinCode'),
      CreatedAt: this.toMinuteIso(),
    };

    this.db.teams.push(team);
    this.db.team_members.push({ Uid: leaderId, Tid: tid });

    return team;
  }

  joinTeamByCode(payload) {
    const { userId, joinCode } = payload;
    const team = this.db.teams.find((t) => t.JoinCode === joinCode.toUpperCase());

    if (!team) {
      throw new Error('Team join code not found');
    }

    const existing = this.db.team_members.find((tm) => tm.Uid === userId && tm.Tid === team.Tid);
    if (existing) {
      throw new Error('User already in team');
    }

    this.db.team_members.push({ Uid: userId, Tid: team.Tid });
    return team;
  }

  getLobby(gid) {
    const group = this.getGroupById(gid);
    const subgroups = this.getSubgroups(gid);
    const teams = this.db.teams.filter((t) => t.Gid === gid);
    const teamMembers = this.db.team_members;

    return { group, subgroups, teams, teamMembers };
  }

  getTeam(tid) {
    return this.db.teams.find((t) => t.Tid === tid);
  }

  getMapPoints(gid, sgid = null) {
    const gameData = this.db.game_data.find((entry) => entry.Gid === Number(gid));
    if (!gameData) {
      return [];
    }
    if (sgid === null || sgid === undefined) {
      return gameData.GeoCaches;
    }
    return gameData.GeoCaches.filter((cache) => cache.SGid === Number(sgid));
  }

  normalizeCache(cache, gid) {
    return {
      id: cache.CacheId ?? cache.id,
      coordinates: {
        latitude: Number(cache.Latitude ?? cache.coordinates?.latitude ?? 0),
        longitude: Number(cache.Longitude ?? cache.coordinates?.longitude ?? 0),
      },
      radius: Number(cache.TriggerMeters ?? cache.radius ?? 20),
      clue: cache.Title ?? cache.clue ?? 'Cache',
      groupId: Number(gid),
      subgroupId: Number(cache.SGid ?? cache.subgroupId ?? 1),
      claimedBy: cache.ClaimedBy ?? null,
      claimedAt: cache.ClaimedAt ?? null,
    };
  }

  getCaches(gid, sgid = null) {
    const gameData = this.db.game_data.find((entry) => entry.Gid === Number(gid));
    if (!gameData) {
      return [];
    }
    const caches = gameData.GeoCaches || [];
    const filtered = sgid === null || sgid === undefined
      ? caches
      : caches.filter((cache) => Number(cache.SGid) === Number(sgid));
    return filtered.map((cache) => this.normalizeCache(cache, gid));
  }

  upsertCache(payload) {
    const {
      gid,
      cacheId,
      latitude,
      longitude,
      radius = 20,
      clue = 'Cache',
      subgroupId = 1,
    } = payload;

    const groupId = Number(gid);
    const gameData = this.ensureGroupGameData(groupId);
    const id = cacheId || `C${Date.now()}`;
    const existingIndex = (gameData.GeoCaches || []).findIndex(
      (cache) => (cache.CacheId ?? cache.id) === id,
    );

    const nextCache = {
      CacheId: id,
      Title: clue,
      Latitude: Number(latitude),
      Longitude: Number(longitude),
      TriggerMeters: Number(radius),
      SGid: Number(subgroupId),
      ClaimedBy: existingIndex >= 0 ? gameData.GeoCaches[existingIndex].ClaimedBy ?? null : null,
      ClaimedAt: existingIndex >= 0 ? gameData.GeoCaches[existingIndex].ClaimedAt ?? null : null,
    };

    if (!gameData.GeoCaches) {
      gameData.GeoCaches = [];
    }

    if (existingIndex >= 0) {
      gameData.GeoCaches[existingIndex] = nextCache;
    } else {
      gameData.GeoCaches.push(nextCache);
    }

    return this.normalizeCache(nextCache, groupId);
  }

  claimCache(payload) {
    const { gid, cacheId, uid = null, tid = null } = payload;
    const gameData = this.db.game_data.find((entry) => entry.Gid === Number(gid));
    if (!gameData || !gameData.GeoCaches) {
      throw new Error('Game data not found');
    }
    const target = gameData.GeoCaches.find((cache) => (cache.CacheId ?? cache.id) === cacheId);
    if (!target) {
      throw new Error('Cache not found');
    }

    target.ClaimedBy = tid || uid;
    target.ClaimedAt = this.toMinuteIso();

    return this.normalizeCache(target, gid);
  }

  updateGroupSettings(payload) {
    const { gid, ...settings } = payload;
    const group = this.getGroupById(gid);
    if (!group) {
      throw new Error('Group not found');
    }
    Object.assign(group, settings);
    return group;
  }

  getState() {
    return this.db;
  }
}

const dbController = new DbController();

export { DbController };
export default dbController;
