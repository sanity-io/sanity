# Auth e2e tests

End-to-end tests for the studio auth flows — covering cookie, token, and dual auth modes, cross-tab sync, `redirectOnSingle`, and SSO scenarios. All API calls are mocked via Playwright `page.route()`, so no real credentials are needed.

## Running the tests

Start the auth test studio (keep it running):

```bash
pnpm --filter auth-test-studio dev --port 3340
```

Run all auth tests:

```bash
pnpm --filter e2e test:auth
```

Run a single spec:

```bash
pnpm --filter e2e test:auth tests/auth/cookieAuth.spec.ts
```

Filter by test name:

```bash
pnpm --filter e2e test:auth -g "login after logout"
```

Add `--headed` to watch the browser.

## Test files

| File                       | What it covers                                                               |
| -------------------------- | ---------------------------------------------------------------------------- |
| `smoke.spec.ts`            | Studio loads with mocked auth                                                |
| `cookieAuth.spec.ts`       | Cookie auth cross-tab sync (logout/login propagation via BroadcastChannel)   |
| `tokenAuth.spec.ts`        | Token auth cross-tab sync (logout/login propagation via localStorage + BC)   |
| `dualAuth.spec.ts`         | Dual auth cross-tab sync — both cookie and token paths                       |
| `redirectOnSingle.spec.ts` | `redirectOnSingle` behavior: skips chooser, and re-shows chooser post-logout |
| `sso.spec.ts`              | SSO workspaces with a single SAML provider                                   |

## How the tests work

All API responses are mocked via Playwright `page.route()` — no real credentials are needed. The mocks control when `/users/me` returns a user (authenticated) or an empty object (unauthenticated).

The token auth tests include a catch-all route that returns empty 200 responses for any unmocked Sanity API endpoint. This prevents the fake broadcast token from hitting real servers and triggering 401 errors on studio infrastructure endpoints (`/acl`, `/features`, `/projects`, etc.).

## The auth-test-studio config

The studio at `dev/auth-test-studio/sanity.config.ts` defines many workspaces covering every combination of login method, `redirectOnSingle`, and SSO. It has a toggle at the top of the file:

```ts
const USE_STAGING = false
```

### Default: `USE_STAGING = false` (production mode)

Uses the production API with **two** projects (`ppsg7ml5` and `q5caobza`). Because there are multiple projects, workspace names and paths are prefixed with the project ID:

- `/ppsg7ml5/cookie`
- `/ppsg7ml5/token`
- `/q5caobza/cookie`
- ...and so on

This is what the e2e tests target — `helpers.ts` hardcodes `PROJECT_ID = 'ppsg7ml5'` and builds URLs like `http://localhost:3340/ppsg7ml5/<workspace>`.

### `USE_STAGING = true`

Uses the staging API (`api.sanity.work`) with a single project (`exx11uqh`). With only one project, the prefix is dropped — URLs collapse to `/cookie`, `/token`, etc. Useful for manual testing with shorter URLs.

## Manual verification

To verify auth flows manually with a real Sanity account, use the URLs below. **These assume `USE_STAGING = false` (the default).** If you flip `USE_STAGING = true`, drop the `/ppsg7ml5` prefix from all URLs.

Prerequisites:

1. Start the studio: `pnpm --filter auth-test-studio dev --port 3340`
2. Open Chrome (or any browser)

### Cookie auth

Base URL: `http://localhost:3340/ppsg7ml5/cookie`

#### Logout broadcasts to other tab

1. Open the URL above in **Tab A** and log in
2. Wait for the studio navbar to appear
3. Open the same URL in **Tab B**
4. Wait for the studio navbar to appear
5. In **Tab A**: click the user menu (bottom-left avatar) then "Sign out"
6. **Tab A** shows the login screen
7. **Verify**: switch to **Tab B** — it should also show the login screen without refreshing

#### Login broadcasts to other tab

1. Continue from above (both tabs showing login screen)
2. In **Tab A**: click a login provider and complete the OAuth flow
3. **Tab A** shows the studio navbar
4. **Verify**: switch to **Tab B** — it should also show the studio navbar without refreshing

#### Single tab logout

1. Open the URL above in one tab and log in
2. Click user menu then "Sign out"
3. **Verify**: the login screen appears

### Token auth

Base URL: `http://localhost:3340/ppsg7ml5/token`

#### Logout broadcasts to other tab

1. Open the URL above in **Tab A** and log in
2. Wait for the studio navbar to appear
3. Open the same URL in **Tab B**
4. Wait for the studio navbar to appear
5. In **Tab A**: click user menu then "Sign out"
6. **Tab A** shows the login screen
7. **Verify**: switch to **Tab B** — it should also show the login screen
8. **Bonus**: DevTools > Application > Local Storage — `__studio_auth_token_*` should be cleared

#### Login broadcasts to other tab

1. Continue from above (both tabs showing login screen)
2. In **Tab A**: click a login provider and complete the OAuth flow
3. **Tab A** shows the studio navbar
4. **Verify**: switch to **Tab B** — it should also show the studio navbar
5. **Bonus**: check Local Storage — `__studio_auth_token_*` should have a token value

#### Single tab logout

1. Open the URL above in one tab and log in
2. Click user menu then "Sign out"
3. **Verify**: the login screen appears

### SSO

The auth-test-studio includes SSO workspaces that replace the default providers with a single SAML provider. The SAML URL in `sanity.config.ts` points at a Sanity.io test SSO config — replace with your own to test a different provider.

- `/ppsg7ml5/sso-cookie` — SSO with cookie auth
- `/ppsg7ml5/sso-token` — SSO with token auth
- `/ppsg7ml5/sso-dual` — SSO with dual auth
- `/ppsg7ml5/sso-cookie-redirectOnSingle` — SSO + `redirectOnSingle` (skips provider chooser, redirects straight to SSO)
- `/ppsg7ml5/sso-token-redirectOnSingle`
- `/ppsg7ml5/sso-dual-redirectOnSingle`

### All available workspaces

With `USE_STAGING = false`, these exist for each of the two projects (`ppsg7ml5` and `q5caobza`). Prefix every path with `/ppsg7ml5/` or `/q5caobza/`.

| Path                          | Login method | Notes                      |
| ----------------------------- | ------------ | -------------------------- |
| `cookie`                      | cookie       | Used by e2e tests          |
| `token`                       | token        | Used by e2e tests          |
| `dual`                        | dual         | Cookie with token fallback |
| `cookie-redirectOnSingle`     | cookie       | Skips provider chooser     |
| `token-redirectOnSingle`      | token        | Skips provider chooser     |
| `dual-redirectOnSingle`       | dual         | Skips provider chooser     |
| `sso-cookie`                  | cookie       | Single SSO provider        |
| `sso-token`                   | token        | Single SSO provider        |
| `sso-dual`                    | dual         | Single SSO provider        |
| `sso-cookie-redirectOnSingle` | cookie       | SSO + `redirectOnSingle`   |
| `sso-token-redirectOnSingle`  | token        | SSO + `redirectOnSingle`   |
| `sso-dual-redirectOnSingle`   | dual         | SSO + `redirectOnSingle`   |

### What to watch for

- Cross-tab sync should happen within a few seconds with no refresh
- If a tab doesn't update, check the browser console for errors
- Token auth stores the token in localStorage; cookie auth relies on HTTP cookies. Both use BroadcastChannel for cross-tab notification
