# Database Structure

This project uses split JSON files in `DB/` so each collection behaves like its own REST endpoint.

## Purpose

- Keep data modular and readable.
- Mirror server-side endpoint structure before moving to a hosted REST API.
- Allow the app to load all collections into one in-memory state via `app/Model/DbController.js`.

## Files

- `users.json`: user accounts and role state (`Uid`, `Gid`, `SGid`, `TGid`, `IsAcceptedAdmin`).
- `groups.json`: top-level game groups (`Gid`), admin approvals, and group settings.
- `subgroups.json`: subgroup definitions within each group (`SGid` scoped by `Gid`), join codes, cache trigger defaults.
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
- `SGid`: subgroup ID within a group (`0` is admin subgroup).
- `Tid`: unique team ID.
- New IDs are generated from the max existing value in each endpoint collection (`users`, `groups`, `teams`) so no separate counter file is required.

## Admin Logic

- Group creator is set as admin (`SGid = 0`) and accepted.
- New admin join requests go into `admin-waitlist.json` if active admins exist.
- If no active admin exists, the requester is auto-promoted to accepted admin.
- Group-level `ApprovedAdmins` stores accepted admin `Uid` values.

## Timestamp Format

- `CreatedAt` values are stored at minute precision:
  - format: `YYYY-MM-DDTHH:mmZ`
  - example: `2026-03-17T14:42Z`

