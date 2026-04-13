# Auth cross-tab sync e2e tests

These tests verify that authentication state (login/logout) syncs across browser tabs via BroadcastChannel, for both cookie and token auth modes.

## Running the tests

Start the auth test studio (keep it running):

```bash
pnpm --filter auth-test-studio dev --port 3340
```

Run all auth tests:

```bash
pnpm --filter e2e exec playwright test --config=playwright.auth.config.ts
```

Run a single test:

```bash
pnpm --filter e2e exec playwright test --config=playwright.auth.config.ts -g "Token auth.*login after logout" --retries=0 tests/auth/tokenAuth.spec.ts
```

Add `--headed` to watch the browser.

## How the tests work

All API responses are mocked via Playwright `page.route()` — no real credentials are needed. The mocks control when `/users/me` returns a user (authenticated) or 401 (unauthenticated).

The token auth tests include a catch-all route that returns empty 200 responses for any unmocked Sanity API endpoint. This prevents the fake broadcast token from hitting real servers and triggering 401 errors on studio infrastructure endpoints (`/acl`, `/features`, `/projects`, etc.).

## Manual verification

To verify cross-tab auth sync manually with a real Sanity account:

### Prerequisites

1. Start the studio: `pnpm --filter auth-test-studio dev --port 3340`
2. Open Chrome (or any browser)

### Cookie auth (http://localhost:3340/cookie)

#### Logout broadcasts to other tab

1. Open `http://localhost:3340/cookie` in **Tab A** and log in
2. Wait for the studio navbar to appear
3. Open `http://localhost:3340/cookie` in **Tab B**
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

1. Open `http://localhost:3340/cookie` in one tab and log in
2. Click user menu then "Sign out"
3. **Verify**: the login screen appears

### Token auth (http://localhost:3340/token)

#### Logout broadcasts to other tab

1. Open `http://localhost:3340/token` in **Tab A** and log in
2. Wait for the studio navbar to appear
3. Open `http://localhost:3340/token` in **Tab B**
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

1. Open `http://localhost:3340/token` in one tab and log in
2. Click user menu then "Sign out"
3. **Verify**: the login screen appears

### SSO (http://localhost:3340/sso/cookie, /sso/token, /sso/redirect)

The auth-test-studio includes SSO workspaces that replace the default providers with a single SAML provider. These require a real SSO provider URL configured in `dev/auth-test-studio/sanity.config.ts`.

- `/sso-cookie` — SSO with cookie auth
- `/sso-token` — SSO with token auth
- `/sso-dual-redirectOnSingle` — SSO with `redirectOnSingle` (skips provider chooser, redirects straight to SSO)

### Available workspaces

| Path                           | Login method   | Notes                      |
| ------------------------------ | -------------- | -------------------------- |
| `/cookie`                      | cookie         | Used by e2e tests          |
| `/token`                       | token          | Used by e2e tests          |
| `/dual`                        | dual (default) | Cookie with token fallback |
| `/cookie-redirectOnSingle`     | cookie         | Skips provider chooser     |
| `/token-redirectOnSingle`      | token          | Skips provider chooser     |
| `/dual-redirectOnSingle`       | dual           | Skips provider chooser     |
| `/sso-cookie`                  | cookie         | Single SSO provider        |
| `/sso-token`                   | token          | Single SSO provider        |
| `/sso-dual`                    | dual           | Single SSO provider        |
| `/sso-cookie-redirectOnSingle` | cookie         | SSO + redirectOnSingle     |
| `/sso-token-redirectOnSingle`  | token          | SSO + redirectOnSingle     |
| `/sso-dual-redirectOnSingle`   | dual           | SSO + redirectOnSingle     |

### What to watch for

- Cross-tab sync should happen within a few seconds with no refresh
- If a tab doesn't update, check the browser console for errors
- Token auth stores the token in localStorage; cookie auth relies on HTTP cookies. Both use BroadcastChannel for cross-tab notification
