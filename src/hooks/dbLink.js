import usersSeed from '../../DB/users.json';
import groupsSeed from '../../DB/groups.json';
import subgroupsSeed from '../../DB/subgroups.json';
import subgroupMembershipsSeed from '../../DB/subgroup-memberships.json';
import adminWaitlistSeed from '../../DB/admin-waitlist.json';
import teamsSeed from '../../DB/teams.json';
import teamMembersSeed from '../../DB/team-members.json';
import gameDataSeed from '../../DB/game-data.json';
import gameTypesSeed from '../../DB/game-types.json';

const buildDbLink = () => ({
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

export default buildDbLink;

