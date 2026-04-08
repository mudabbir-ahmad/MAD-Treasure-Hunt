const http = require('http');
const fs = require('fs');
const path = require('path');

// --- Configuration ---

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// --- Data Helpers ---

const readJson = (fileName) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, fileName), 'utf-8'));
const writeJson = (fileName, data) => fs.writeFileSync(path.join(DATA_DIR, fileName), JSON.stringify(data, null, 2));

// --- Utility Helpers ---

const hashPassword = (value) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return `H_${Math.abs(hash)}`;
};

const nextId = (rows, key) => rows.reduce((max, row) => {
    const val = Number(row[key] || 0);
    return val > max ? val : max;
}, 0) + 1;

const generateCode = (len = 5) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < len; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
};

// --- Request / Response Helpers ---

const parseBody = (req) => new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', () => {
        try { resolve(body ? JSON.parse(body) : {}); }
        catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
});

const sendJson = (res, statusCode, payload) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (statusCode === 204) {
        res.writeHead(204, headers);
        res.end();
        return;
    }
    headers['Content-Type'] = 'application/json';
    res.writeHead(statusCode, headers);
    res.end(JSON.stringify(payload));
};

// --- Simple Router ---

const routes = [];

const addRoute = (method, pattern, handler) => {
    const keys = [];
    const regexStr = pattern.replace(/:([a-zA-Z]+)/g, (_, key) => {
        keys.push(key);
        return '([^/]+)';
    });
    routes.push({ method, regex: new RegExp(`^${regexStr}$`), keys, handler });
};

const matchRoute = (method, pathname) => {
    for (const r of routes) {
        if (r.method !== method) continue;
        const match = pathname.match(r.regex);
        if (match) {
            const params = {};
            r.keys.forEach((key, i) => { params[key] = match[i + 1]; });
            return { handler: r.handler, params };
        }
    }
    return null;
};

// ======================================================================
//  AUTH ROUTES
// ======================================================================

addRoute('POST', '/auth/login', async (req, res) => {
    const payload = await parseBody(req);
    const users = readJson('users.json');
    const user = users.find((u) => u.email.toLowerCase() === String(payload.email || '').toLowerCase());
    if (!user) return sendJson(res, 400, { message: 'Email not found' });
    if (user.passwordHash !== hashPassword(String(payload.password || '')))
        return sendJson(res, 400, { message: 'Invalid password' });
    sendJson(res, 200, user);
});

addRoute('POST', '/auth/register', async (req, res) => {
    const payload = await parseBody(req);
    const username = String(payload.username || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    const confirmPassword = String(payload.confirmPassword || '');
    const accountType = String(payload.accountType || 'Individual');

    if (!username || !email || !password || !confirmPassword)
        return sendJson(res, 400, { message: 'Missing required registration fields' });
    if (password !== confirmPassword)
        return sendJson(res, 400, { message: 'Passwords do not match' });

    const users = readJson('users.json');
    if (users.some((u) => u.email.toLowerCase() === email))
        return sendJson(res, 400, { message: 'Email already in use' });

    const user = {
        Uid: nextId(users, 'Uid'),
        username,
        email,
        passwordHash: hashPassword(password),
        isBusiness: accountType === 'Business/School',
        IsAcceptedAdmin: false,
        Gid: null,
        SGid: null,
        TGid: null,
    };

    users.push(user);
    writeJson('users.json', users);
    sendJson(res, 201, user);
});

// ======================================================================
//  USERS  CRUDL
// ======================================================================

addRoute('GET', '/users', (req, res) => {
    sendJson(res, 200, readJson('users.json'));
});

addRoute('GET', '/users/:id', (req, res, params) => {
    const users = readJson('users.json');
    const user = users.find((u) => String(u.Uid) === params.id);
    if (!user) return sendJson(res, 404, { message: 'User not found' });
    sendJson(res, 200, user);
});

addRoute('PUT', '/users/:id', async (req, res, params) => {
    const payload = await parseBody(req);
    const users = readJson('users.json');
    const idx = users.findIndex((u) => String(u.Uid) === params.id);
    if (idx === -1) return sendJson(res, 404, { message: 'User not found' });
    users[idx] = { ...users[idx], ...payload, Uid: users[idx].Uid };
    writeJson('users.json', users);
    sendJson(res, 200, users[idx]);
});

addRoute('DELETE', '/users/:id', (req, res, params) => {
    const users = readJson('users.json');
    const idx = users.findIndex((u) => String(u.Uid) === params.id);
    if (idx === -1) return sendJson(res, 404, { message: 'User not found' });
    users.splice(idx, 1);
    writeJson('users.json', users);
    sendJson(res, 204, null);
});

// ======================================================================
//  GAME TYPES  (read-only list)
// ======================================================================

addRoute('GET', '/game-types', (req, res) => {
    sendJson(res, 200, readJson('game-types.json'));
});

// ======================================================================
//  GROUPS  CRUDL
// ======================================================================

addRoute('GET', '/groups', (req, res, params, query) => {
    let groups = readJson('groups.json');
    if (query.CreatedByUid) groups = groups.filter((g) => String(g.CreatedByUid) === query.CreatedByUid);
    sendJson(res, 200, groups);
});

addRoute('GET', '/groups/:gid', (req, res, params) => {
    const groups = readJson('groups.json');
    const group = groups.find((g) => String(g.Gid) === params.gid);
    if (!group) return sendJson(res, 404, { message: 'Group not found' });
    sendJson(res, 200, group);
});

addRoute('POST', '/groups', async (req, res) => {
    const payload = await parseBody(req);
    const groups = readJson('groups.json');

    const group = {
        Gid: nextId(groups, 'Gid'),
        GroupName: payload.GroupName || 'Unnamed Group',
        BusinessOrSchoolName: payload.BusinessOrSchoolName || null,
        GameType: payload.GameType || 'private',
        AdminJoinCode: generateCode(),
        CreatedByUid: payload.CreatedByUid,
        MaxMemberSubgroups: payload.MaxMemberSubgroups || 1,
        TeamsEnabled: payload.TeamsEnabled !== undefined ? payload.TeamsEnabled : true,
        CacheTriggerMeters: payload.CacheTriggerMeters || 20,
        ApprovedAdmins: [payload.CreatedByUid],
        CreatedAt: new Date().toISOString(),
    };
    groups.push(group);
    writeJson('groups.json', groups);

    // Create default admin and member subgroups
    const subgroups = readJson('subgroups.json');
    const adminSg = {
        SGid: nextId(subgroups, 'SGid'),
        SubGroupName: 'Admins',
        Gid: group.Gid,
        JoinCode: null,
        IsAdminGroup: true,
        CacheTriggerMeters: 20,
    };
    subgroups.push(adminSg);

    const memberSg = {
        SGid: nextId(subgroups, 'SGid'),
        SubGroupName: 'Members',
        Gid: group.Gid,
        JoinCode: generateCode(),
        IsAdminGroup: false,
        CacheTriggerMeters: 20,
    };
    subgroups.push(memberSg);
    writeJson('subgroups.json', subgroups);

    // Add creator as admin membership
    const memberships = readJson('subgroup-memberships.json');
    memberships.push({
        id: nextId(memberships, 'id'),
        Uid: payload.CreatedByUid,
        Gid: group.Gid,
        SGid: adminSg.SGid,
        IsAcceptedAdmin: true,
    });
    writeJson('subgroup-memberships.json', memberships);


    // Update the creating user
    const users = readJson('users.json');
    const uIdx = users.findIndex((u) => u.Uid === payload.CreatedByUid);
    if (uIdx !== -1) {
        users[uIdx].Gid = group.Gid;
        users[uIdx].SGid = adminSg.SGid;
        users[uIdx].IsAcceptedAdmin = true;
        writeJson('users.json', users);
    }

    sendJson(res, 201, group);
});

addRoute('PUT', '/groups/:gid', async (req, res, params) => {
    const payload = await parseBody(req);
    const groups = readJson('groups.json');
    const idx = groups.findIndex((g) => String(g.Gid) === params.gid);
    if (idx === -1) return sendJson(res, 404, { message: 'Group not found' });
    groups[idx] = { ...groups[idx], ...payload, Gid: groups[idx].Gid };
    writeJson('groups.json', groups);
    sendJson(res, 200, groups[idx]);
});

addRoute('DELETE', '/groups/:gid', (req, res, params) => {
    const groups = readJson('groups.json');
    const idx = groups.findIndex((g) => String(g.Gid) === params.gid);
    if (idx === -1) return sendJson(res, 404, { message: 'Group not found' });
    groups.splice(idx, 1);
    writeJson('groups.json', groups);
    sendJson(res, 204, null);
});

// ======================================================================
//  SUBGROUPS  CRUDL
// ======================================================================

addRoute('GET', '/subgroups', (req, res, params, query) => {
    let rows = readJson('subgroups.json');
    if (query.Gid) rows = rows.filter((r) => String(r.Gid) === query.Gid);
    sendJson(res, 200, rows);
});

addRoute('GET', '/subgroups/:id', (req, res, params) => {
    const rows = readJson('subgroups.json');
    const row = rows.find((r) => String(r.SGid) === params.id);
    if (!row) return sendJson(res, 404, { message: 'Subgroup not found' });
    sendJson(res, 200, row);
});

addRoute('POST', '/subgroups', async (req, res) => {
    const payload = await parseBody(req);
    const rows = readJson('subgroups.json');
    payload.SGid = nextId(rows, 'SGid');
    if (!payload.JoinCode) payload.JoinCode = generateCode();
    rows.push(payload);
    writeJson('subgroups.json', rows);
    sendJson(res, 201, payload);
});

addRoute('PUT', '/subgroups/:id', async (req, res, params) => {
    const payload = await parseBody(req);
    const rows = readJson('subgroups.json');
    const idx = rows.findIndex((r) => String(r.SGid) === params.id);
    if (idx === -1) return sendJson(res, 404, { message: 'Subgroup not found' });
    rows[idx] = { ...rows[idx], ...payload, SGid: rows[idx].SGid };
    writeJson('subgroups.json', rows);
    sendJson(res, 200, rows[idx]);
});

addRoute('DELETE', '/subgroups/:id', (req, res, params) => {
    const rows = readJson('subgroups.json');
    const idx = rows.findIndex((r) => String(r.SGid) === params.id);
    if (idx === -1) return sendJson(res, 404, { message: 'Subgroup not found' });
    rows.splice(idx, 1);
    writeJson('subgroups.json', rows);
    sendJson(res, 204, null);
});

// ======================================================================
//  SUBGROUP MEMBERSHIPS  CRUDL
// ======================================================================

addRoute('GET', '/subgroup-memberships', (req, res, params, query) => {
    let rows = readJson('subgroup-memberships.json');
    if (query.Gid) rows = rows.filter((r) => String(r.Gid) === query.Gid);
    if (query.Uid) rows = rows.filter((r) => String(r.Uid) === query.Uid);
    if (query.SGid) rows = rows.filter((r) => String(r.SGid) === query.SGid);
    sendJson(res, 200, rows);
});

addRoute('GET', '/subgroup-memberships/:id', (req, res, params) => {
    const rows = readJson('subgroup-memberships.json');
    const row = rows.find((r) => String(r.id) === params.id);
    if (!row) return sendJson(res, 404, { message: 'Membership not found' });
    sendJson(res, 200, row);
});

addRoute('POST', '/subgroup-memberships', async (req, res) => {
    const payload = await parseBody(req);
    const rows = readJson('subgroup-memberships.json');

    // If a JoinCode was supplied, look up the matching subgroup
    if (payload.JoinCode) {
        const subgroups = readJson('subgroups.json');
        const sg = subgroups.find((s) => s.JoinCode === String(payload.JoinCode).toUpperCase());
        if (!sg) return sendJson(res, 400, { message: 'Invalid join code' });
        payload.Gid = sg.Gid;
        payload.SGid = sg.SGid;
    }

    payload.id = nextId(rows, 'id');
    payload.IsAcceptedAdmin = payload.IsAcceptedAdmin || false;
    rows.push(payload);
    writeJson('subgroup-memberships.json', rows);

    // Update user record with group / subgroup
    const users = readJson('users.json');
    const uIdx = users.findIndex((u) => u.Uid === payload.Uid);
    if (uIdx !== -1) {
        users[uIdx].Gid = payload.Gid;
        users[uIdx].SGid = payload.SGid;
        writeJson('users.json', users);
    }

    sendJson(res, 201, payload);
});

addRoute('PUT', '/subgroup-memberships/:id', async (req, res, params) => {
    const payload = await parseBody(req);
    const rows = readJson('subgroup-memberships.json');
    const idx = rows.findIndex((r) => String(r.id) === params.id);
    if (idx === -1) return sendJson(res, 404, { message: 'Membership not found' });
    rows[idx] = { ...rows[idx], ...payload, id: rows[idx].id };
    writeJson('subgroup-memberships.json', rows);
    sendJson(res, 200, rows[idx]);
});

addRoute('DELETE', '/subgroup-memberships/:id', (req, res, params) => {
    const rows = readJson('subgroup-memberships.json');
    const idx = rows.findIndex((r) => String(r.id) === params.id);
    if (idx === -1) return sendJson(res, 404, { message: 'Membership not found' });

    const removed = rows[idx];
    rows.splice(idx, 1);
    writeJson('subgroup-memberships.json', rows);

    // Cascade: remove from team if in one
    const teamMembers = readJson('team-members.json');
    const tmIdx = teamMembers.findIndex((r) => r.Uid === removed.Uid);
    if (tmIdx !== -1) {
        const tmRemoved = teamMembers[tmIdx];
        teamMembers.splice(tmIdx, 1);
        // Transfer leadership to longest-serving member if leader left
        if (tmRemoved.IsLeader) {
            const remaining = teamMembers.filter((r) => r.Tid === tmRemoved.Tid);
            if (remaining.length > 0) {
                remaining.sort((a, b) => new Date(a.JoinedAt || 0) - new Date(b.JoinedAt || 0));
                remaining[0].IsLeader = true;
            }
        }
        writeJson('team-members.json', teamMembers);
    }

    // Clear user game data
    const users = readJson('users.json');
    const uIdx = users.findIndex((u) => u.Uid === removed.Uid);
    if (uIdx !== -1) {
        users[uIdx].Gid = null;
        users[uIdx].SGid = null;
        users[uIdx].TGid = null;
        users[uIdx].IsAcceptedAdmin = false;
        writeJson('users.json', users);
    }

    sendJson(res, 204, null);
});

// ======================================================================
//  TEAMS  CRUDL
// ======================================================================

addRoute('GET', '/teams', (req, res, params, query) => {
    let rows = readJson('teams.json');
    if (query.Gid) rows = rows.filter((r) => String(r.Gid) === query.Gid);
    sendJson(res, 200, rows);
});

addRoute('GET', '/teams/:id', (req, res, params) => {
    const rows = readJson('teams.json');
    const row = rows.find((r) => String(r.Tid) === params.id);
    if (!row) return sendJson(res, 404, { message: 'Team not found' });
    sendJson(res, 200, row);
});

addRoute('POST', '/teams', async (req, res) => {
    const payload = await parseBody(req);
    const rows = readJson('teams.json');
    payload.Tid = nextId(rows, 'Tid');
    if (!payload.JoinCode) payload.JoinCode = generateCode();
    rows.push(payload);
    writeJson('teams.json', rows);
    sendJson(res, 201, payload);
});

addRoute('PUT', '/teams/:id', async (req, res, params) => {
    const payload = await parseBody(req);
    const rows = readJson('teams.json');
    const idx = rows.findIndex((r) => String(r.Tid) === params.id);
    if (idx === -1) return sendJson(res, 404, { message: 'Team not found' });
    rows[idx] = { ...rows[idx], ...payload, Tid: rows[idx].Tid };
    writeJson('teams.json', rows);
    sendJson(res, 200, rows[idx]);
});

addRoute('DELETE', '/teams/:id', (req, res, params) => {
    const rows = readJson('teams.json');
    const idx = rows.findIndex((r) => String(r.Tid) === params.id);
    if (idx === -1) return sendJson(res, 404, { message: 'Team not found' });
    rows.splice(idx, 1);
    writeJson('teams.json', rows);
    sendJson(res, 204, null);
});

// ======================================================================
//  TEAM MEMBERS  CRUDL
// ======================================================================

addRoute('GET', '/team-members', (req, res, params, query) => {
    let rows = readJson('team-members.json');
    if (query.Tid) rows = rows.filter((r) => String(r.Tid) === query.Tid);
    if (query.Uid) rows = rows.filter((r) => String(r.Uid) === query.Uid);
    sendJson(res, 200, rows);
});

addRoute('GET', '/team-members/:id', (req, res, params) => {
    const rows = readJson('team-members.json');
    const row = rows.find((r) => String(r.id) === params.id);
    if (!row) return sendJson(res, 404, { message: 'Team member not found' });
    sendJson(res, 200, row);
});

addRoute('POST', '/team-members', async (req, res) => {
    const payload = await parseBody(req);
    const rows = readJson('team-members.json');

    // If a JoinCode was supplied, check if it matches an admin join code first
    if (payload.JoinCode) {
        const code = String(payload.JoinCode).toUpperCase();
        const groups = readJson('groups.json');
        const adminGroup = groups.find((g) => g.AdminJoinCode === code);
        if (adminGroup) {
            // Add to admin waitlist instead of joining as team member
            const waitlist = readJson('admin-waitlist.json');
            if (waitlist.some((w) => w.Uid === payload.Uid && w.Gid === adminGroup.Gid)) {
                return sendJson(res, 200, { adminWaitlist: true, message: 'Already on waitlist' });
            }
            const entry = {
                id: nextId(waitlist, 'id'),
                Uid: payload.Uid,
                Gid: adminGroup.Gid,
                RequestedAt: new Date().toISOString(),
            };
            waitlist.push(entry);
            writeJson('admin-waitlist.json', waitlist);
            return sendJson(res, 200, { adminWaitlist: true, ...entry });
        }

        const teams = readJson('teams.json');
        const team = teams.find((t) => t.JoinCode === code);
        if (!team) return sendJson(res, 400, { message: 'Invalid team join code' });
        payload.Tid = team.Tid;
    }

    // Auto-set leader if first member in team
    const existing = rows.filter((r) => r.Tid === payload.Tid);
    payload.id = nextId(rows, 'id');
    payload.JoinedAt = new Date().toISOString();
    payload.IsLeader = existing.length === 0;
    rows.push(payload);
    writeJson('team-members.json', rows);

    // Update user TGid
    const users = readJson('users.json');
    const uIdx = users.findIndex((u) => u.Uid === payload.Uid);
    if (uIdx !== -1) {
        users[uIdx].TGid = payload.Tid;
        writeJson('users.json', users);
    }

    sendJson(res, 201, payload);
});

addRoute('PUT', '/team-members/:id', async (req, res, params) => {
    const payload = await parseBody(req);
    const rows = readJson('team-members.json');
    const idx = rows.findIndex((r) => String(r.id) === params.id);
    if (idx === -1) return sendJson(res, 404, { message: 'Team member not found' });
    rows[idx] = { ...rows[idx], ...payload, id: rows[idx].id };
    writeJson('team-members.json', rows);
    sendJson(res, 200, rows[idx]);
});

addRoute('DELETE', '/team-members/:id', (req, res, params) => {
    const rows = readJson('team-members.json');
    const idx = rows.findIndex((r) => String(r.id) === params.id);
    if (idx === -1) return sendJson(res, 404, { message: 'Team member not found' });

    const removed = rows[idx];
    rows.splice(idx, 1);

    // Transfer leadership to longest-serving member if leader left
    if (removed.IsLeader) {
        const remaining = rows.filter((r) => r.Tid === removed.Tid);
        if (remaining.length > 0) {
            remaining.sort((a, b) => new Date(a.JoinedAt || 0) - new Date(b.JoinedAt || 0));
            remaining[0].IsLeader = true;
        }
    }

    writeJson('team-members.json', rows);

    // Clear user TGid
    const users = readJson('users.json');
    const uIdx = users.findIndex((u) => u.Uid === removed.Uid);
    if (uIdx !== -1) {
        users[uIdx].TGid = null;
        writeJson('users.json', users);
    }

    sendJson(res, 204, null);
});

// ======================================================================
//  ADMIN WAITLIST  CRUDL
// ======================================================================

addRoute('GET', '/admin-waitlist', (req, res, params, query) => {
    let rows = readJson('admin-waitlist.json');
    if (query.Gid) rows = rows.filter((r) => String(r.Gid) === query.Gid);
    if (query.Uid) rows = rows.filter((r) => String(r.Uid) === query.Uid);
    sendJson(res, 200, rows);
});

addRoute('POST', '/admin-waitlist', async (req, res) => {
    const payload = await parseBody(req);
    const rows = readJson('admin-waitlist.json');
    payload.id = nextId(rows, 'id');
    rows.push(payload);
    writeJson('admin-waitlist.json', rows);
    sendJson(res, 201, payload);
});

addRoute('DELETE', '/admin-waitlist/:id', (req, res, params) => {
    const rows = readJson('admin-waitlist.json');
    const idx = rows.findIndex((r) => String(r.id) === params.id);
    if (idx === -1) return sendJson(res, 404, { message: 'Waitlist entry not found' });
    rows.splice(idx, 1);
    writeJson('admin-waitlist.json', rows);
    sendJson(res, 204, null);
});

// Approve an admin from the waitlist
addRoute('POST', '/admin-waitlist/:id/approve', async (req, res, params) => {
    const waitlist = readJson('admin-waitlist.json');
    const idx = waitlist.findIndex((w) => String(w.id) === params.id);
    if (idx === -1) return sendJson(res, 404, { message: 'Waitlist entry not found' });

    const entry = waitlist[idx];
    waitlist.splice(idx, 1);
    writeJson('admin-waitlist.json', waitlist);

    // Find the admin subgroup for this game
    const subgroups = readJson('subgroups.json');
    const adminSg = subgroups.find((sg) => sg.Gid === entry.Gid && sg.IsAdminGroup);
    if (!adminSg) return sendJson(res, 400, { message: 'Admin subgroup not found' });

    // Create subgroup membership
    const memberships = readJson('subgroup-memberships.json');
    const membership = {
        id: nextId(memberships, 'id'),
        Uid: entry.Uid,
        Gid: entry.Gid,
        SGid: adminSg.SGid,
        IsAcceptedAdmin: true,
    };
    memberships.push(membership);
    writeJson('subgroup-memberships.json', memberships);

    // Update user record
    const users = readJson('users.json');
    const uIdx = users.findIndex((u) => u.Uid === entry.Uid);
    if (uIdx !== -1) {
        users[uIdx].Gid = entry.Gid;
        users[uIdx].SGid = adminSg.SGid;
        users[uIdx].IsAcceptedAdmin = true;
        writeJson('users.json', users);
    }

    // Add to approved admins list in group
    const groups = readJson('groups.json');
    const gIdx = groups.findIndex((g) => g.Gid === entry.Gid);
    if (gIdx !== -1) {
        if (!groups[gIdx].ApprovedAdmins) groups[gIdx].ApprovedAdmins = [];
        groups[gIdx].ApprovedAdmins.push(entry.Uid);
        writeJson('groups.json', groups);
    }

    sendJson(res, 200, membership);
});

// ======================================================================
//  CACHES  CRUDL  (standalone — reads/writes caches.json)
// ======================================================================

// Helper: convert storage row to API response format
const toCacheApi = (cache) => ({
    id: cache.CacheId,
    name: cache.Title || '',
    clue: cache.Clue || '',
    coordinates: { latitude: cache.Latitude, longitude: cache.Longitude },
    radius: cache.TriggerMeters,
    groupId: cache.Gid,
    subgroupId: cache.SGid,
    Claims: cache.Claims || [],
});

// GET /caches  — list caches for a group (optional SGid filter)
addRoute('GET', '/caches', (req, res, params, query) => {
    let rows = readJson('caches.json');
    if (query.Gid) rows = rows.filter((r) => String(r.Gid) === query.Gid);
    if (query.SGid) rows = rows.filter((r) => String(r.SGid) === query.SGid);
    sendJson(res, 200, rows.map(toCacheApi));
});

// POST /caches  — create a new cache
addRoute('POST', '/caches', async (req, res) => {
    const payload = await parseBody(req);
    const rows = readJson('caches.json');

    const cache = {
        CacheId: nextId(rows, 'CacheId'),
        Gid: payload.Gid,
        SGid: payload.SGid || null,
        Title: payload.Title || '',
        Clue: payload.Clue || '',
        Latitude: payload.Latitude || 0,
        Longitude: payload.Longitude || 0,
        TriggerMeters: payload.TriggerMeters || 20,
        Claims: [],
    };

    rows.push(cache);
    writeJson('caches.json', rows);
    sendJson(res, 201, toCacheApi(cache));
});

// POST /caches/reset  — clear all claims for every cache in a game
addRoute('POST', '/caches/reset', async (req, res, params, query) => {
    const rows = readJson('caches.json');
    const gid = query.Gid;
    if (!gid) return sendJson(res, 400, { message: 'Gid query parameter required' });

    for (const cache of rows) {
        if (String(cache.Gid) === gid) cache.Claims = [];
    }

    writeJson('caches.json', rows);
    sendJson(res, 200, { message: 'Game reset successfully' });
});

// POST /caches/reset-player/:uid  — remove all claims by a specific user
addRoute('POST', '/caches/reset-player/:uid', async (req, res, params, query) => {
    const rows = readJson('caches.json');
    const gid = query.Gid;
    if (!gid) return sendJson(res, 400, { message: 'Gid query parameter required' });

    const uid = Number(params.uid);
    for (const cache of rows) {
        if (String(cache.Gid) === gid && cache.Claims) {
            cache.Claims = cache.Claims.filter((c) => c.Uid !== uid);
        }
    }

    writeJson('caches.json', rows);
    sendJson(res, 200, { message: 'Player progress reset' });
});

// GET /caches/:id  — read a single cache
addRoute('GET', '/caches/:id', (req, res, params) => {
    const rows = readJson('caches.json');
    const row = rows.find((r) => String(r.CacheId) === params.id);
    if (!row) return sendJson(res, 404, { message: 'Cache not found' });
    sendJson(res, 200, toCacheApi(row));
});

// PUT /caches/:id  — update a cache
addRoute('PUT', '/caches/:id', async (req, res, params) => {
    const payload = await parseBody(req);
    const rows = readJson('caches.json');
    const idx = rows.findIndex((r) => String(r.CacheId) === params.id);
    if (idx === -1) return sendJson(res, 404, { message: 'Cache not found' });

    const existing = rows[idx];
    rows[idx] = {
        ...existing,
        Title: payload.Title != null ? payload.Title : existing.Title,
        Clue: payload.Clue != null ? payload.Clue : existing.Clue,
        Latitude: payload.Latitude != null ? payload.Latitude : existing.Latitude,
        Longitude: payload.Longitude != null ? payload.Longitude : existing.Longitude,
        TriggerMeters: payload.TriggerMeters != null ? payload.TriggerMeters : existing.TriggerMeters,
        SGid: payload.SGid != null ? payload.SGid : existing.SGid,
        // Preserve CacheId, Gid and Claims — updates must not overwrite these
        CacheId: existing.CacheId,
        Gid: existing.Gid,
        Claims: existing.Claims || [],
    };

    writeJson('caches.json', rows);
    sendJson(res, 200, toCacheApi(rows[idx]));
});

// DELETE /caches/:id  — delete a cache
addRoute('DELETE', '/caches/:id', (req, res, params) => {
    const rows = readJson('caches.json');
    const idx = rows.findIndex((r) => String(r.CacheId) === params.id);
    if (idx === -1) return sendJson(res, 404, { message: 'Cache not found' });
    rows.splice(idx, 1);
    writeJson('caches.json', rows);
    sendJson(res, 204, null);
});

// POST /caches/:id/claim  — claim a cache (team-aware: prevents same team from claiming again)
addRoute('POST', '/caches/:id/claim', async (req, res, params) => {
    const payload = await parseBody(req);
    const rows = readJson('caches.json');
    const cache = rows.find((r) => String(r.CacheId) === params.id);
    if (!cache) return sendJson(res, 404, { message: 'Cache not found' });

    if (!cache.Claims) cache.Claims = [];

    // Prevent the same team (or individual if no team) from claiming twice
    if (payload.Tid && cache.Claims.some((c) => c.Tid === payload.Tid)) {
        return sendJson(res, 400, { message: 'Your team has already claimed this cache' });
    }
    if (!payload.Tid && cache.Claims.some((c) => c.Uid === payload.Uid && !c.Tid)) {
        return sendJson(res, 400, { message: 'You have already claimed this cache' });
    }

    cache.Claims.push({
        Uid: payload.Uid,
        Tid: payload.Tid || null,
        ClaimedAt: new Date().toISOString(),
    });

    writeJson('caches.json', rows);
    sendJson(res, 200, toCacheApi(cache));
});

// ======================================================================
//  HEALTH CHECK
// ======================================================================

addRoute('GET', '/health', (req, res) => {
    sendJson(res, 200, { ok: true });
});

// ======================================================================
//  SERVER
// ======================================================================

const server = http.createServer(async (req, res) => {
    // CORS preflight
    if (req.method === 'OPTIONS') return sendJson(res, 200, { ok: true });

    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    const query = Object.fromEntries(url.searchParams);

    const matched = matchRoute(req.method, pathname);
    if (matched) {
        try {
            await matched.handler(req, res, matched.params, query);
        } catch (err) {
            sendJson(res, 500, { message: err.message });
        }
        return;
    }

    sendJson(res, 404, { message: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
    process.stdout.write(`Server running on http://0.0.0.0:${PORT}\n`);
    process.stdout.write(`  -> Local:   http://localhost:${PORT}\n`);
    // Log the LAN IP so users know what to point to from other devices
    const nets = require('os').networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                process.stdout.write(`  -> Network: http://${net.address}:${PORT}\n`);
            }
        }
    }
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        process.stderr.write(`ERROR: Port ${PORT} is already in use.\n`);
    } else {
        process.stderr.write(`ERROR: ${err.message}\n`);
    }
    process.exit(1);
});

