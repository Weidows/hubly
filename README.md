# Hubly

An unofficial, mobile-first client for the Hugging Face Hub — browse models, datasets, Spaces,
papers and the blog, sign in with your HF account, post comments and save things to collections.

Not affiliated with Hugging Face. There is no backend: every request goes straight from the app to
`huggingface.co`.

## Stack

| Piece | Choice | Why |
| --- | --- | --- |
| Framework | Expo SDK 58 / React Native 0.88 | one codebase for iOS, Android and web |
| Routing | Expo Router | tabs in `src/app/(tabs)`, detail screens pushed on the root stack |
| Data | `@tanstack/react-query` | caching + retry that respects HF rate limits |
| Auth | Hugging Face OAuth **device code** flow | works in Expo Go, on Android and on web with no redirect URI |
| Markdown | `@ronradtke/react-native-markdown-display` + `src/lib/model-card.ts` | model cards render without a WebView |
| i18n | in-repo flat dictionaries (en, zh) | ~2 KB instead of a framework |

## Commands

This project uses **bun** (`bun@1.4.3` via scoop). Use `bun`/`bunx`, not `npm`/`npx`.

```bash
bun install                      # dependencies (creates bun.lock)
bun run web                      # browser build (fastest loop on Windows)
bun run android                  # Expo Go / emulator
bunx expo lint                   # lint
bunx tsc --noEmit                # typecheck
bunx expo export --platform web  # bundle check
bunx expo-doctor                 # dependency/config diagnosis
```

Expo note: `bunx expo install <pkg>` resolves SDK-compatible versions — prefer it over
`bun add` for anything Expo ships.

## Environment

Copy `.env.example` to `.env` and fill in what you have:

- `EXPO_PUBLIC_HF_CLIENT_ID` — client id of the Hubly OAuth app (a **public app**, no secret).
  Create it at <https://huggingface.co/settings/applications/new> with scopes
  `openid`, `profile`, `write-discussions`, `write-collections`. No redirect URI is needed.
- `EXPO_PUBLIC_HF_ENDPOINT` — optional API host override (defaults to `https://huggingface.co`).
  Users behind a wall can point it at a mirror or a self-hosted reverse proxy.

## API notes worth knowing before touching `src/api/`

- Pagination is `limit` + `skip`. `offset` is accepted but **silently ignored**; `cursor` returns 400.
- Public read endpoints need no token. Writes (comments, collections) need a token carrying
  `write-discussions` / `write-collections`.
- Discussion events return **both** `data.latest.raw` (markdown) and `data.latest.html`; the app
  renders `raw` because React Native cannot render HTML.
- `/api/daily_papers` puts the thumbnail on the wrapper entry, not inside `paper`.
- Rate limits (per IP, 5-minute window): anonymous 500 API / 3 000 resolve; signed-in 1 000 / 5 000.
  A 429 carries `RateLimit` and `RateLimit-Policy` headers.
- `huggingface.co` is unreachable from mainland China without a proxy — that is why the endpoint is
  configurable and why the app never routes traffic through its own server.
- React Query keys must never collide across endpoints: `useDailyPapers` (`/api/daily_papers`) and
  `usePaperFeed` (`/api/papers`) return different shapes and used to share a key.

## Layout

```
src/
  api/       client.ts (fetch wrapper) · types.ts · repos.ts · papers.ts · blog.ts · social.ts
  auth/      device-flow.ts · storage.ts (SecureStore ⇄ localStorage) · auth-context.tsx
  components/ ui.tsx · repo-card.tsx · paper-row.tsx · markdown.tsx · app-tabs.tsx (+ .web)
  hooks/     queries.ts
  i18n/      dict.ts · en.ts · zh.ts · index.ts
  lib/       query.ts · format.ts · model-card.ts
  theme/     tokens.ts (the design system lives here)
  app/       _layout.tsx (stack) · (tabs)/ · repo/[type]/[owner]/[name].tsx
design/
  variants/  the three design directions that were considered
  screens/   screenshots of the running app
```

## Development gotchas (learned the hard way)

- **Restart the dev server after moving/renaming route files.** Metro keeps serving the old bundle
  otherwise, which looks like a logic bug in a screen that never changed.
- Expo's native tab bar (`expo-router/native-tabs`) is used on devices; web uses the custom bar in
  `src/components/app-tabs.web.tsx` because the app is mobile-first.

## Status

See [ROADMAP.md](./ROADMAP.md).
