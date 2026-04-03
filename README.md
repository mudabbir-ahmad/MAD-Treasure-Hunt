# MAD Treasure Hunt

Treasure Hunt mobile app built with React Native and Expo.

## Run

```bash
npm install
npm run lint
expo start --android
```

## Structure

- `App.js`: app navigation entry.
- `src/components/layout`: shared screen wrapper.
- `src/components/UI`: shared UI components.
- `src/components/screens`: app screens.
- `src/hooks`: app state, API link, and feature hooks.
- `DB`: local JSON data files.

## Notes

- The app accesses game/auth data through the centralized API endpoint via `src/hooks/dbLink.js`.
- Navigation is handled with React Navigation native stack.

