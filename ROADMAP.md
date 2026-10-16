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
| 3 | Device-code auth + token storage (SecureStore ⇄ localStorage) | comments/collections need it | manual: sign in on Expo Go, token survives restart | ⬜ |
| 4 | i18n (en/zh) + locale switch | public app | toggle in Settings flips every string | ✅ code, ⬜ UI |
| 5 | **Design direction chosen from 3 variants** | look decides retention | user picks from `design/variants/*.png` | ⏳ |
| 6 | Feed: Repos tab (Models/Datasets/Spaces) with limit+skip paging | the core loop | scroll to page 3 on device with real data | ⬜ |
| 7 | Repo detail: card markdown, file tree, stats, likers | reading experience | open `HuggingFaceTB/SmolVLM2-2.2B-Instruct` and see a real card | ⬜ |
| 8 | Papers tab: daily + trending + search, paper detail | second core loop | daily papers list matches huggingface.co/papers | ⬜ |
| 9 | Blog tab + social posts feed | "全上" scope | blog list loads `allBlogs` | ⬜ |
| 10 | Discussions: list, thread, post comment, reply, react | the social core | post a real comment, see it on the web UI | ⬜ |
| 11 | Collections: save repo, my collections, remove item | "收藏" | item shows up on huggingface.co collection page | ⬜ |
| 12 | Notifications + Me tab (likes, following) | retention | notification badge reflects unread | ⬜ |
| 13 | Polish: pull-to-refresh, skeletons, empty/error states, accessibility | store-quality | manual pass on device + web | ⬜ |
| 14 | Release: EAS build (needs expo.dev account), store assets, privacy note | ship it | `eas build --platform android` artifact installs | ⬜ |

## Known open questions

- `collectionsForRepo` uses an `item` query filter that is not in the published OpenAPI spec —
  verify against a live token before relying on it.
- `markNotificationsRead` body shape is undocumented — verify with a live token.
- Model-card LaTeX renders as plain text (no KaTeX without a WebView). Decide later whether the
  math matters enough to add one.

## Run log

| Date | What |
| --- | --- |
| 2026-10-16 | Project scaffolded (Expo SDK 58, RN 0.88). API/auth/i18n foundation written; web export passes. 3 design variants rendered for review. |
