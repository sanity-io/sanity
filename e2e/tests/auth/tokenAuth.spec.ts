// eslint-disable-next-line no-restricted-imports -- auth tests use raw Playwright (no studio-test fixtures)
import {expect, type Page, test} from '@playwright/test'

import {watchForStudioErrors} from '../../helpers/studioErrors'

// The auth-test-studio uses projectId: 'ppsg7ml5' with production API (api.sanity.io)
// and loginMethod: 'token'. We mock all API responses so no real credentials are needed.
const STUDIO_URL = 'http://localhost:3340/token'
const PROJECT_ID = 'ppsg7ml5'
const TOKEN_STORAGE_KEY = `__studio_auth_token_storage_v1_${PROJECT_ID}`

const MOCK_USER = {
  id: 'mock-user-123',
  name: 'Test User',
  email: 'test@example.com',
  profileImage: '',
  provider: 'google',
  role: '',
  roles: [{name: 'administrator', title: 'Administrator'}],
}

const MOCK_PROVIDERS = {
  providers: [
    {
      name: 'google',
      title: 'Google',
      url: 'https://api.sanity.io/v1/auth/login/google',
      logo: null,
    },
  ],
  thirdPartyLogin: true,
}

const MOCK_TOKEN = 'mock-token-abc123'

/**
 * Set up route mocks for a token-authenticated user.
 * Token auth stores the token in localStorage and uses it in API request headers
 * (instead of HTTP cookies). The auth store reads the token from localStorage on init.
 */
async function setupMockAuth(page: Page) {
  let authenticated = true

  // Mock /users/me — returns mock user or 401 depending on auth state
  await page.route('**/users/me*', (route) => {
    if (authenticated) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER),
      })
    }
    return route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Not authenticated',
      }),
    })
  })

  // Mock /auth/providers
  await page.route('**/auth/providers*', (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PROVIDERS),
    })
  })

  // Mock /auth/id probe — for token mode this is probed during SID exchange.
  // Return 401 so the auth store falls through to token storage (not cookie).
  await page.route('**/auth/id*', (route) => {
    return route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Not authenticated',
      }),
    })
  })

  // Mock /auth/fetch?sid=... — SID-to-token exchange
  await page.route('**/auth/fetch*', (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({token: MOCK_TOKEN}),
    })
  })

  // Mock /auth/logout
  await page.route('**/auth/logout*', (route) => {
    authenticated = false
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ok: true}),
    })
  })

  // Block trial/journey dialog and announcements overlay
  await page.route('**/journey/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: 'null',
    }),
  )

  return {
    /** Simulate server-side logout so subsequent /users/me calls return 401 */
    logOut() {
      authenticated = false
    },
    /** Simulate server-side login so subsequent /users/me calls return the mock user */
    logIn() {
      authenticated = true
    },
  }
}

/**
 * Seed localStorage with a mock token before navigation.
 * The auth store reads from localStorage on init when loginMethod is 'token'.
 */
async function seedToken(page: Page) {
  await page.addInitScript(
    ({key, token}) => {
      localStorage.setItem(key, JSON.stringify({token}))
    },
    {key: TOKEN_STORAGE_KEY, token: MOCK_TOKEN},
  )
}

test.describe('Token auth: cross-tab sync', () => {
  test.beforeEach(async ({context}) => {
    watchForStudioErrors(context)
  })

  test('logout in one tab reflects in another tab via BroadcastChannel', async ({context}) => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    // Set up authenticated mocks for both pages
    const page1Auth = await setupMockAuth(page1)
    const page2Auth = await setupMockAuth(page2)

    // Seed token in localStorage so both pages start authenticated
    await seedToken(page1)
    await seedToken(page2)

    // Load tabs sequentially to avoid broadcast races during init
    await page1.goto(STUDIO_URL)
    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible({
      timeout: 30_000,
    })

    await page2.goto(STUDIO_URL)
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible({
      timeout: 30_000,
    })

    // Switch both mocks to unauthenticated before triggering logout.
    // Both pages may re-check /users/me after receiving the BroadcastChannel
    // message, so both mocks must return 401.
    page1Auth.logOut()
    page2Auth.logOut()

    // In page1: open user menu and click "Sign out"
    await page1.locator('[id="user-menu"]').click()
    await page1.getByText('Sign out').click()

    // Page1 should show the login screen
    await expect(
      page1.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible({
      timeout: 15_000,
    })

    // Page2 should also show login screen via BroadcastChannel sync
    await expect(
      page2.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible({
      timeout: 15_000,
    })
  })

  test('login after logout syncs across tabs via BroadcastChannel', async ({context}) => {
    const page1 = await context.newPage()
    const page1Auth = await setupMockAuth(page1)
    await seedToken(page1)

    // 1. Load page1 first and wait for it to be fully authenticated
    await page1.goto(STUDIO_URL)
    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible({
      timeout: 30_000,
    })

    // 2. Then load page2 — sequential to avoid broadcast race during init
    const page2 = await context.newPage()
    const page2Auth = await setupMockAuth(page2)
    await seedToken(page2)
    await page2.goto(STUDIO_URL)
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible({
      timeout: 30_000,
    })

    // 3. Logout from page2
    page1Auth.logOut()
    page2Auth.logOut()
    await page2.locator('[id="user-menu"]').click()
    await page2.getByText('Sign out').click()

    // Both tabs should show the login screen
    await expect(
      page2.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible({timeout: 15_000})
    await expect(
      page1.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible({timeout: 15_000})

    // 4. Simulate login in page1 by navigating with #sid=<session-id>.
    //    For token auth, the auth store:
    //    a) Exchanges the SID for a token via GET /auth/fetch?sid=...
    //    b) Stores the token in localStorage via tokenStorage.update({token})
    //    c) Broadcasts the new token to other tabs via BroadcastChannel
    page1Auth.logIn()
    page2Auth.logIn()
    await page1.goto(`${STUDIO_URL}#sid=mock-session-id-12345678`)

    // Page1 should be authenticated again (navbar visible)
    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible({
      timeout: 30_000,
    })

    // Page2 should also become authenticated via BroadcastChannel sync
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible({
      timeout: 30_000,
    })
  })

  test('single tab logout shows login screen', async ({context}) => {
    const page = await context.newPage()
    await setupMockAuth(page)
    await seedToken(page)

    await page.goto(STUDIO_URL)
    await expect(page.locator('[data-testid="studio-navbar"]')).toBeVisible({
      timeout: 30_000,
    })

    // Open user menu and click "Sign out"
    await page.locator('[id="user-menu"]').click()
    await page.getByText('Sign out').click()

    // Should show the login screen
    await expect(page.locator('[data-ui="Heading"]:has-text("Choose login provider")')).toBeVisible(
      {
        timeout: 15_000,
      },
    )
  })
})
