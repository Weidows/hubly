# ROADMAP — Hubly

**North star:** a mobile-first Hugging Face Hub client that makes *reading* (models, papers, blog)
and *talking about* them (comments, collections) pleasant on a phone — no model downloads, no
backend, sign-in with the user's own HF account.

## Decisions already locked

| Decision | Value | Why |
| --- | --- | --- |
| Audience | public, worldwide (App Store / Play later) | — |
| Network | call `huggingface.co` directly; never proxy through our own server | users behind a wall configure their own proxy |
| Auth | Device code OAuth, public app, no secret | only flow that works in Expo Go + web + Android at once |
| Auth scopes | `openid profile write-discussions write-collections` | least privilege for the features we ship |
| Platforms for v1 acceptance | Expo Web + Android (Expo Go) | no Mac available for iOS simulator; EAS later |
| i18n | English default, Simplified Chinese when device is Chinese | public app |
| App name | Hubly (repo `huggingface-app`) | HF name would be rejected / trademark risk |

## Steps

| # | Step | Why | Verification | Status |
| --- | --- | --- | --- | --- |
| 1 | Scaffold Expo SDK 58 + expo-router, commit template | baseline that builds | `npx expo export --platform web` → `Exported: dist` | ✅ |
| 2 | API layer (`src/api/*`) with verified shapes | every screen depends on it | `npx tsc --noEmit` clean; endpoints re-checked against live API | ✅ |
| 3 | Device-code auth + token storage (SecureStore ⇄ localStorage) | comments/collections need it | native device flow verified live (start + pending poll); web uses PKCE instead | ✅ native / ✅ web PKCE |
| 4 | i18n (en/zh) + locale switch | public app | switch flips every string; device locale auto-detected (screenshot is zh) | ✅ |
| 15 | Web sign-in (PKCE) + `/auth/callback` | the device flow is CORS-blocked in browsers | verified by driving a real click in headless Edge: the browser lands on `/oauth/authorize` with client_id, redirect_uri, SCOPE, state and S256 challenge. Needs both loopback redirect URIs registered | ✅ code + URL verified / ⬜ needs registered redirect URI |
| 5 | Design direction | look decides retention | **proceeded with V3 Warm Hub + V1 reading typography, light-first with system dark** — awaiting user confirmation, tokens are one-file to change | ⏳ |
| 6 | Feed: Repos tab (Models/Datasets/Spaces) with limit+skip paging | the core loop | live trending models render with real counts | ✅ |
| 7 | Repo detail: card markdown, file tree, stats, discussions | reading experience | `HuggingFaceTB/SmolVLM2-2.2B-Instruct` renders its real card (YAML + HTML normalised) | ✅ |
| 8 | Papers tab: daily + trending + search, paper detail | second core loop | real daily papers with thumbnails render | ✅ list / ⬜ detail |
| 9 | Blog tab + social posts feed | "全上" scope | real blog titles render (global + 中文) | ✅ blog / ⬜ posts |
| 10 | Discussions: list, thread, post comment, reply, react | the social core | thread `/discussion/model/HuggingFaceTB/SmolVLM2-2.2B-Instruct/30` renders the real comment; posting needs a signed-in run | ✅ thread + composer + reactions / ⬜ create discussion |
| 11 | Collections: save repo, my collections, remove item | "收藏" | save sheet wired to `POST /api/collections` + `/items`; end-to-end needs sign-in | ✅ UI + calls / ⬜ my-collections screen |
| 12 | Notifications + Me tab (likes, following) | retention | notification badge reflects unread | ⬜ hooks ready (`useNotifications`, `useMarkNotificationsRead`), screen not built |
| 13 | Polish: pull-to-refresh, skeletons, empty/error states, accessibility | store-quality | manual pass on device + web | ⬜ partial (refresh + empty/error done) |
| 14 | Release: EAS build (needs expo.dev account), store assets, privacy note | ship it | `eas build --platform android` artifact installs | ⬜ |

## Known open questions

- `collectionsForRepo` uses an `item` query filter that is not in the published OpenAPI spec —
  verify against a live token before relying on it.
- `markNotificationsRead` body shape is undocumented — verify with a live token.
- Model-card LaTeX renders as plain text (no KaTeX without a WebView). Decide later whether the
  math matters enough to add one.
- HTML tables inside model cards lose their grid (tags are stripped, cells kept). Acceptable until
  someone complains.

## Run log

| Date | What |
| --- | --- |
| 2026-10-16 | Project scaffolded (Expo SDK 58, RN 0.88). API/auth/i18n foundation written. 3 design variants rendered for review. |
| 2026-10-16 | Repos/Papers/Blog/Me screens + repo detail built and verified against live HF data on the web build. Three real bugs found and fixed: react-query key collision between `/api/daily_papers` and `/api/papers`, detail screens living inside the tab navigator (moved to a root stack), model cards rendering raw YAML + HTML (added `src/lib/model-card.ts`). Learned: Metro serves a stale bundle after route files move — restart the dev server. |
| 2026-10-16 | Migrated to bun; dropped `@expo/vector-icons` (expo-doctor 20/20). Repo renamed to `hubly` and pushed public to https://github.com/Weidows/hubly. OAuth client id wired and verified live (`/oauth/device` returns `expires_in: 300`, no `interval`; unapproved poll → 400 `authorization_pending`). |
| 2026-10-16 | Discussion thread + comment composer + reactions + save-to-collection sheet. Two more bugs caught by verification: an **empty** `EXPO_PUBLIC_HF_ENDPOINT` in `.env` made every request relative (`??` does not catch empty strings) so the API calls hit the dev server and returned HTML; and long URLs in markdown overflowed horizontally on every platform (RN/react-native-web expose no `word-break`), fixed with zero-width-space soft wrapping that skips code spans and link targets. |
| 2026-10-16 | **Downgraded SDK 58 → 57** (Expo Go on Play is 57, so 58 was untestable on a phone): expo 57.0.30 / expo-router 57.0.28 / RN 0.86.3 / react 19.2.3, native-tabs import moved to `expo-router/unstable-native-tabs`, unused 58-template deps dropped. expo-doctor 21/21. |
| 2026-10-16 | **Fixed web sign-in**: `POST /oauth/device` sends no CORS headers, so the browser device flow could never work ("Failed to fetch"). Web now uses authorization code + PKCE via a full-page `/oauth/authorize` navigation and a `/auth/callback` route whose code exchange hits the CORS-enabled `/oauth/token`. Verified by driving a real mouse click through CDP: the browser navigated to `/oauth/authorize` with the correct client_id, redirect_uri, scopes, state and S256 challenge. |
