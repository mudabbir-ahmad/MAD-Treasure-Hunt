# Welcome to the mobile application development repository for our Treasure Hunt Game! This project is built using React Native and Expo.

## Get started

1. Install dependencies

   ```bash
   npm i
   ```

2. Start the app

   ```bash
   expo start --android 
   ```



# Database Structure

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

## User Types and Private Game Rules

### Individual Users (`isBusiness: false`)

- **Private Game Creation**: Individuals can create **one** private game per account.
  - Auto-creates **subgroup 0** (admins) and **subgroup 1** (members/self).
  - `MaxMemberSubgroups` is set to `1` (cannot create additional subgroups).
  - Individual becomes a **member** of subgroup 1, not an admin.
  - Cannot view "Admin Hub" options; instead see "Manage Game" UI for active team management.

- **Team Participation**: Individuals can create and join teams within their subgroup 1.
  - Admins (those in subgroup 0) are blocked from team participation.

### Business/School Users (`isBusiness: true`)

- **Private Game Creation**: Businesses can create private games with flexible subgroup management.
  - Auto-creates **subgroup 0** (admins) only; no auto-member subgroup.
  - `MaxMemberSubgroups` is set to `999` (can create up to 999 subgroups).
  - Business creator becomes an **accepted admin** of subgroup 0 immediately.

- **Admin Participation**: Business admins (SGid 0, IsAcceptedAdmin true) **cannot participate in teams**.
  - Game Lobby shows warning message and hides team creation/join controls.
  - Admins must manage subgroups and games from Admin Hub and Manage Subgroups pages.

- **Admin Approval Flow**: New admins joining a business group go into `admin-waitlist.json` if an active admin already exists.
  - Auto-promoted if no active admin exists.
  - Promoted admins gain accepted admin status.

## Subgroup Visibility

- **Manage Subgroups Page**: Only displays subgroups with `SGid > 0` (member subgroups).
  - Subgroup 0 (admins) is hidden in the UI to avoid confusion.
  - Features search by name/ID and card-based display with status and team info.
  - Only visible to business users; individual users see an informational message.

## Admin Logic

- Group creator is auto-set as admin (`SGid = 0`) if business account.
- New admin join requests go into `admin-waitlist.json` if active admins exist.
- If no active admin exists, the requester is auto-promoted to accepted admin.
- Group-level `ApprovedAdmins` stores accepted admin `Uid` values.
- Admins cannot create or join teams; they manage the game and subgroups.

## Game Flow

### Login / Registration

1. User registers as Individual or Business/School.
2. Session stores `isBusiness` and `IsAcceptedAdmin` flags.

### Individual Private Game Flow

1. Individual selects "Manage Private Game" option.
2. Check if they have an existing private game:
   - **If existing**: Navigate to "Manage Game" screen → "Open Team Manager" → join/create team.
   - **If new**: Navigate to "Create Game" screen → create game → then to "Manage Game".
3. Individual can only manage their single team in subgroup 1.
4. Cannot access Admin Hub or Subgroup management.

### Business Private Game Flow

1. Business user selects "Manage Private Game" option.
2. Presented with:
   - **Create New Private Game**: Creates a game with admin subgroup 0 only.
   - **Join as Admin for Private Game**: Submit request to join an existing business group.
3. Once admin (accepted or auto-promoted), access Admin Hub:
   - Create a Game
   - Manage Existing Game (team/lobby controls)
   - Manage Subgroups (search, filter, create member subgroups)
4. Cannot create/join teams in Game Lobby (shows warning).

### Team Management

- Teams can only be created/joined in **non-admin subgroups** (`SGid > 0`).
- Admin users (SGid 0 + IsAcceptedAdmin) are blocked from team participation.
- Teams are scoped per subgroup.

## Timestamp Format

- `CreatedAt` values are stored at minute precision:
  - format: `YYYY-MM-DDTHH:mmZ`
  - example: `2026-03-17T14:42Z`

