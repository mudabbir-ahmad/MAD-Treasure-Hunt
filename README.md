# MAD Treasure Hunt

Treasure Hunt mobile app built with React Native and Expo.

## Run

```bash
npm i
npx expo start --android
```

## Notes

- The app accesses game/auth data through the centralized API endpoint via `src/components/API/API.js`.
- Navigation is handled with React Navigation native stack.
- Sometimes you might have to switch the API Endpoint URL. This is just Because of the fact that when I'm using the app I can't access the API endpoint, from the global URL. Therefore, I need my local API Server's IP as the URL
- Just Uncomment the `API_ENDPOINT` variable in `src/components/API/API.js` to use the actual API Server Which is `api.bobby.ip-ddns.com` [Do not add any port thing here as it uses port 80 by default].
