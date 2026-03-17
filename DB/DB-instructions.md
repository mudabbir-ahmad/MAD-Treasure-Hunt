# Database Structure & Game Rules

This project uses split JSON files in `DB/` so each collection behaves like its own REST endpoint.

## Purpose

- Keep data modular and readable.
- Mirror server-side endpoint structure before moving to a hosted REST API.
- Allow the app to load all collections into one in-memory state via `app/Model/DbController.js`.

## Files

- `users.json`: user accounts and role state (`Uid`, `Gid`, `SGid`, `TGid`, `isBusiness`, `IsAcceptedAdmin`).
- `groups.json`: top-level game groups (`Gid`), admin approvals, group settings, creator metadata (`CreatedByUid`, `IsBusinessGroup`), and subgroup limits (`MaxMemberSubgroups`).
- `subgroups.json`: subgroup definitions within each group (`SGid` scoped by `Gid`), join codes, cache trigger defaults, and game status (`IsGameStarted`).
- `subgroup-memberships.json`: membership bridge from `Uid` to `Gid`/`SGid`.
- `admin-waitlist.json`: pending admin requests for groups when active admins already exist.
- `teams.json`: team entities for non-admin subgroup players.
- `team-members.json`: membership bridge from `Uid` to `Tid`.
- `game-data.json`: per-group game payloads (geocaches, map/game objects).
- `game-types.json`: available game type options for UI flow.
- `db.json`: index file listing split JSON resources.

## ID Rules

- `Uid`: unique user ID.
- `Gid`: unique group/game ID.
- `SGid`: subgroup ID within a group (`0` is admin subgroup; `1+` are member subgroups).
- `Tid`: unique team ID.
- New IDs are generated from the max existing value in each endpoint collection (`users`, `groups`, `teams`) so no separate counter file is required.

## User Types: Individual vs Business

### Individual Users (`isBusiness: false`)

**Private Game Creation Rules:**
- Individuals can create **one private game per account**.
- Auto-creates:
  - **Subgroup 0**: Admin subgroup (empty on creation).
  - **Subgroup 1**: Members subgroup (individual joins as member, not admin).
- `MaxMemberSubgroups` is set to `1` (no additional subgroups can be created).
- Individual has `SGid = 1` and `IsAcceptedAdmin = false`.
- If an individual tries to create a game again, returns the existing game.

**Team Participation:**
- Individuals can create and join teams **only in subgroup 1**.
- Cannot access admin functions or view Admin Hub.
- Game management is simplified: "Manage Game" screen instead of "Admin Hub".

### Business/School Users (`isBusiness: true`)

**Private Game Creation Rules:**
- Businesses can create **unlimited private games** (tracked per creator `CreatedByUid`).
- Auto-creates:
  - **Subgroup 0**: Admin subgroup (business becomes member).
  - **No automatic subgroups 1+** (must be created manually).
- `MaxMemberSubgroups` is set to `999` (supports up to 999 subgroups).
- Business creator has `SGid = 0` and `IsAcceptedAdmin = true` (immediately accepted).

**Admin Approval Flow:**
- When a new admin joins via "Join as Admin for Private Game":
  - If an active admin already exists (`hasActiveAdmin` check for SGid 0, IsAcceptedAdmin true):
    - Request added to `admin-waitlist.json` with status `pending`.
    - User is notified: "Admin access request submitted. You will see admin tools after approval."
  - If **no active admin exists**:
    - User is auto-promoted to accepted admin immediately.
    - `IsAcceptedAdmin` is set to `true`.

**Team Participation & Admin Restrictions:**
- **Admins cannot create or join teams** (checked via `canJoinTeamForSubgroup` logic).
- Admins in subgroup 0 see a warning in Game Lobby: "Admins cannot participate in teams. Manage your game from the Admin Hub instead."
- Team controls are hidden for admin users.

## Subgroup Visibility & Management

### Manage Subgroups Page

- **Only business users can access** (individuals see an informational message).
- **Only displays subgroups with `SGid > 0`** (member subgroups).
  - Subgroup 0 (admin) is hidden to avoid confusion.
- **Features:**
  - Search bar to filter by subgroup name or ID.
  - Card-based display showing:
    - Bold subgroup name
    - `ID: [SGid]`
    - `Status: [Active|Inactive]` (based on `IsGameStarted` flag)
    - `Teams: [true|false]`
  - Create form at bottom for adding new subgroups (up to `MaxMemberSubgroups` limit).

### Visibility API

- `getVisibleSubgroups(gid)` returns only subgroups where `SGid > 0`.
- Used by ManageSubgroupsPage for filtering.
- Maintains admin-only (subgroup 0) separation in UI.

## Admin Logic

- Group creator is auto-set as admin (`SGid = 0`) only if **business account**.
- Individual creators are set to subgroup 1 (members) and are never admins.
- Admins cannot create/join teams (blocked by `canJoinTeamForSubgroup` check).
- New admin join requests go into `admin-waitlist.json` if active admins exist.
- If no active admin exists, the requester is auto-promoted to accepted admin.
- Group-level `ApprovedAdmins` stores accepted admin `Uid` values.

## Timestamp Format

- `CreatedAt` values are stored at minute precision:
  - format: `YYYY-MM-DDTHH:mmZ`
  - example: `2026-03-17T14:42Z`

## Summary: Game Flow Decision Tree

```
User Registration
├─ Individual (isBusiness = false)
│  └─ Login → "Manage Private Game" 
│     ├─ Has created game before? 
│     │  ├─ Yes → "Manage Game" screen (team manager)
│     │  └─ No → "Create Game" screen → creates game with subgroups 0 & 1
│     └─ Never sees Admin Hub
│
└─ Business (isBusiness = true)
   └─ Login → "Manage Private Game"
      ├─ "Create New Private Game" → creates game with subgroup 0 only
      └─ "Join as Admin for Private Game" → requests admin access
         ├─ Active admin exists? 
         │  ├─ Yes → queued in admin-waitlist (pending)
         │  └─ No → auto-promoted (accepted)
         └─ Once accepted → Admin Hub access
            ├─ Create a Game
            ├─ Manage Existing Game (blocked from teams)
            └─ Manage Subgroups (create/search member subgroups)
```

