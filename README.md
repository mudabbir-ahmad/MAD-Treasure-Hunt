# MAD Treasure Hunt

Treasure Hunt mobile app built with React Native and Expo.

## Run

```bash
npm i
npm start
```

## Notes

- The app accesses game/auth data through the centralized API endpoint via `src/components/API/API.js`.
- IF encountering network issues, ensure the API endpoint is set to 'http://api.bobby.ip-ddns.com' and not 'http://192.168.8.100:3000'.
- The reason for 'http://192.168.8.100:3000' is due to the API server being on my (Mudabbir's) home network. I need to use local ip due to loop back restrictions with home network(needed for security).
- Just uncomment line 1 in `src/components/API/API.js` to use the actual API Server Which is `api.bobby.ip-ddns.com` [Do not add any port thing here as it uses port 80 by default].


# DB Structure:

API endpoint: `http://api.bobby.ip-ddns.com/`

### Tables:
- `users`
- `teams`
- `team-members`
- `subgroups`
- `subgroup-members`
- `groups`
- `game-types`
- `db`
- `caches`
- `admin-waitlist`

#### Append Table to API URL to view table's json data on browser.
I.e: `http://api.bobby.ip-ddns.com/users` or `http://api.bobby.ip-ddns.com/subgroups-members`