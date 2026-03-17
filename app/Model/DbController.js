import usersSeed from '../../DB/users.json';
import groupsSeed from '../../DB/groups.json';
import subgroupsSeed from '../../DB/subgroups.json';
import subgroupMembershipsSeed from '../../DB/subgroup-memberships.json';
import adminWaitlistSeed from '../../DB/admin-waitlist.json';
import teamsSeed from '../../DB/teams.json';
import teamMembersSeed from '../../DB/team-members.json';
import gameDataSeed from '../../DB/game-data.json';
import gameTypesSeed from '../../DB/game-types.json';
import UserModel from './UserModel';
import GroupModel from './GroupModel';
import TeamModel from './TeamModel';

const buildSeedState = () => ({
  users: usersSeed,
  groups: groupsSeed,
  subgroups: subgroupsSeed,
  subgroup_memberships: subgroupMembershipsSeed,
  admin_waitlist: adminWaitlistSeed,
  teams: teamsSeed,
  team_members: teamMembersSeed,
  game_data: gameDataSeed,
  game_types: gameTypesSeed,
});

class DbController {
  constructor(seed = buildSeedState()) {
    this.seed = JSON.parse(JSON.stringify(seed));
    this.reset();
  }

  reset() {
    this.db = JSON.parse(JSON.stringify(this.seed));
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

  getCreatedPrivateGameByUser(uid) {
    return this.db.groups.find(
      (group) => group.CreatedByUid === Number(uid) && group.GameType === 'private',
    ) || null;
  }

  register({ username, email, password, confirmPassword, accountType }) {
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
    const user = new UserModel({
      Uid: uid,
      username,
      email,
      passwordHash: this.hashPassword(password),
      isBusiness: accountType === 'Business/School',
      IsAcceptedAdmin: false,
      Gid: null,
      SGid: null,
      TGid: null,
    });

    this.db.users.push(user.toJSON());
    return user.toJSON();
  }

  login({ email, password }) {
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

  joinPrivateGame({ userId, joinCode }) {
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

  createPrivateGame({ userId, groupName, businessOrSchoolName, gameType = 'private', isBusiness = false }) {
    const user = this.getUserById(Number(userId));
    if (!user) {
      throw new Error('User not found');
    }

    const existing = this.getCreatedPrivateGameByUser(user.Uid);
    if (existing) {
      return existing;
    }

    const gid = this.nextId('group');
    const isBusinessGroup = Boolean(isBusiness);
    const group = new GroupModel({
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
    });

    this.db.groups.push(group.toJSON());
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
      this.createSubgroup({ gid: group.Gid, subgroupName: 'Members', cacheTriggerMeters: 20 });
    }

    const ownerSgid = isBusinessGroup ? 0 : 1;
    const ownerIsAcceptedAdmin = isBusinessGroup;

    this.ensureMembership(user.Uid, group.Gid, ownerSgid, ownerIsAcceptedAdmin);
    user.Gid = group.Gid;
    user.SGid = ownerSgid;
    user.IsAcceptedAdmin = ownerIsAcceptedAdmin;

    return group.toJSON();
  }

  joinAsAdmin({ userId, businessOrSchoolName }) {
    const user = this.getUserById(Number(userId));
    const group = this.db.groups.find(
      (entry) => entry.BusinessOrSchoolName.toLowerCase() === businessOrSchoolName.trim().toLowerCase(),
    );

    if (!user || !group) {
      throw new Error('User or business/school not found');
    }

    this.ensureMembership(user.Uid, group.Gid, 0, false);
    user.Gid = group.Gid;
    user.SGid = 0;
    user.IsAcceptedAdmin = false;

    const activeAdminExists = this.hasActiveAdmin(group.Gid);
    if (!activeAdminExists) {
      return this.promoteAdmin({ uid: user.Uid, gid: group.Gid, approvedByUid: user.Uid });
    }

    const alreadyQueued = this.db.admin_waitlist.some(
      (entry) => entry.Uid === user.Uid && entry.Gid === group.Gid && entry.Status === 'pending',
    );
    if (!alreadyQueued) {
      this.db.admin_waitlist.push({
        RequestId: `${group.Gid}_${user.Uid}`,
        Uid: user.Uid,
        Gid: group.Gid,
        RequestedAt: this.toMinuteIso(),
        Status: 'pending',
      });
    }

    return { queued: true, Gid: group.Gid, Uid: user.Uid };
  }

  promoteAdmin({ uid, gid, approvedByUid }) {
    const user = this.getUserById(Number(uid));
    const group = this.getGroupById(Number(gid));
    if (!user || !group) {
      throw new Error('User or group not found');
    }

    this.ensureMembership(user.Uid, group.Gid, 0, true);
    user.Gid = group.Gid;
    user.SGid = 0;
    user.IsAcceptedAdmin = true;

    if (!group.ApprovedAdmins.includes(user.Uid)) {
      group.ApprovedAdmins.push(user.Uid);
    }
    if (!group.ApprovedAdmins.includes(Number(approvedByUid))) {
      group.ApprovedAdmins.push(Number(approvedByUid));
    }

    this.db.admin_waitlist = this.db.admin_waitlist.map((entry) => {
      if (entry.Uid === user.Uid && entry.Gid === group.Gid && entry.Status === 'pending') {
        return { ...entry, Status: 'approved' };
      }
      return entry;
    });

    return user;
  }

  requestAdminApproval({ userId, groupId }) {
    const group = this.getGroupById(Number(groupId));
    if (!group) {
      throw new Error('Group not found');
    }
    return this.joinAsAdmin({ userId, businessOrSchoolName: group.BusinessOrSchoolName });
  }

  approveAdmin({ approverUserId, userId, groupId }) {
    const approverMembership = this.db.subgroup_memberships.find(
      (membership) => membership.Uid === Number(approverUserId)
        && membership.Gid === Number(groupId)
        && membership.SGid === 0
        && membership.IsAcceptedAdmin,
    );
    if (!approverMembership) {
      throw new Error('Approver is not an admin for this group');
    }
    return this.promoteAdmin({ uid: Number(userId), gid: Number(groupId), approvedByUid: Number(approverUserId) });
  }

  createSubgroup({ gid, subgroupName, cacheTriggerMeters = 20 }) {
    const group = this.getGroupById(Number(gid));
    if (!group) {
      throw new Error('Group not found');
    }

    const nonAdminCount = this.db.subgroups.filter((entry) => entry.Gid === group.Gid && !entry.IsAdminGroup).length;
    if (nonAdminCount >= group.MaxMemberSubgroups) {
      throw new Error('Maximum subgroup count reached');
    }

    const nextSgid = this.db.subgroups
      .filter((entry) => entry.Gid === group.Gid && !entry.IsAdminGroup)
      .reduce((max, entry) => Math.max(max, entry.SGid), 0) + 1;

    const subgroup = {
      SGid: nextSgid,
      SubGroupName: subgroupName,
      Gid: group.Gid,
      JoinCode: this.generateUniqueJoinCode(this.db.subgroups.filter((entry) => !entry.IsAdminGroup), 'JoinCode'),
      IsAdminGroup: false,
      IsGameStarted: false,
      CacheTriggerMeters: cacheTriggerMeters,
    };

    this.db.subgroups.push(subgroup);
    return subgroup;
  }

  getSubgroups(gid) {
    return this.db.subgroups.filter((subgroup) => subgroup.Gid === Number(gid));
  }

  getVisibleSubgroups(gid) {
    return this.getSubgroups(gid).filter((subgroup) => Number(subgroup.SGid) > 0);
  }

  updateSubgroupCacheSettings({ gid, sgid, triggerMeters }) {
    const subgroup = this.db.subgroups.find(
      (entry) => entry.Gid === Number(gid) && entry.SGid === Number(sgid),
    );
    if (!subgroup) {
      throw new Error('Subgroup not found');
    }
    subgroup.CacheTriggerMeters = Number(triggerMeters);
    return subgroup;
  }

  createTeam({ userId, gid, teamName }) {
    const user = this.getUserById(Number(userId));
    if (!user) {
      throw new Error('User not found');
    }

    const group = this.getGroupById(Number(gid));
    if (!group) {
      throw new Error('Group not found');
    }
    if (!this.canJoinTeamForSubgroup(group, user.SGid || 0)) {
      throw new Error('Teams are disabled or user is in admin subgroup');
    }

    const tid = this.nextId('team');
    const team = new TeamModel({
      Tid: tid,
      TeamName: teamName,
      Gid: group.Gid,
      JoinCode: this.generateUniqueJoinCode(this.db.teams, 'JoinCode'),
      CreatorUid: user.Uid,
      SGid: user.SGid,
      CreatedAt: this.toMinuteIso(),
    });

    this.db.teams.push(team.toJSON());
    this.db.team_members.push({
      Tid: team.Tid,
      Uid: user.Uid,
      IsTeamCreator: true,
    });

    user.TGid = team.Tid;
    return team.toJSON();
  }

  joinTeamByCode({ userId, teamCode }) {
    const user = this.getUserById(Number(userId));
    const team = this.db.teams.find((t) => t.JoinCode === teamCode.toUpperCase());
    if (!user || !team) {
      throw new Error('Invalid user or team code');
    }

    const group = this.getGroupById(team.Gid);
    if (!group || !this.canJoinTeamForSubgroup(group, user.SGid || 0)) {
      throw new Error('Teams are disabled or user is in admin subgroup');
    }

    if (user.Gid !== team.Gid) {
      throw new Error('User is not in this game group');
    }

    const alreadyInTeam = this.db.team_members.some((tm) => tm.Tid === team.Tid && tm.Uid === user.Uid);
    if (!alreadyInTeam) {
      this.db.team_members.push({ Tid: team.Tid, Uid: user.Uid, IsTeamCreator: false });
    }

    user.TGid = team.Tid;
    return team;
  }

  getLobby(gid) {
    const group = this.getGroupById(Number(gid));
    if (!group) {
      return null;
    }

    const members = this.db.subgroup_memberships
      .filter((membership) => membership.Gid === group.Gid)
      .map((membership) => this.getUserById(membership.Uid))
      .filter(Boolean);

    return {
      group,
      members,
      subgroups: this.getSubgroups(group.Gid),
      teams: this.db.teams.filter((team) => team.Gid === group.Gid),
    };
  }

  getTeam(tid) {
    const team = this.db.teams.find((entry) => entry.Tid === Number(tid));
    if (!team) {
      return null;
    }
    const members = this.db.team_members
      .filter((member) => member.Tid === team.Tid)
      .map((member) => this.getUserById(member.Uid))
      .filter(Boolean);
    return { team, members };
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

  updateGroupSettings({ gid, teamsEnabled }) {
    const group = this.getGroupById(Number(gid));
    if (!group) {
      throw new Error('Group not found');
    }
    group.TeamsEnabled = Boolean(teamsEnabled);
    return group;
  }

  getState() {
    return this.db;
  }
}

const dbController = new DbController();

export { DbController };
export default dbController;

