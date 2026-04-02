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
- `src/hooks`: app state, local DB link, and feature hooks.
- `DB`: local JSON data files.

## Notes

- The app uses local JSON data from `DB` through `src/hooks/DbController.js`.
- Navigation is handled with React Navigation native stack.

