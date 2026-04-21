// eslint-disable-next-line no-restricted-imports -- auth tests use raw Playwright (no studio-test fixtures)
import {expect, test} from '@playwright/test'

import {watchForStudioErrors} from '../../helpers/studioErrors'
import {BASE_URL, MOCK_TOKEN, PROJECT_ID, setupMockAuth} from './helpers'

// Dual auth (loginMethod: 'dual') tries cookie first, falls back to token.
// The auth store uses withCredentials (cookies) when available, and stores
// a token in localStorage as fallback.
const STUDIO_URL = `${BASE_URL}/dual`
const TOKEN_STORAGE_KEY = `__studio_auth_token_${PROJECT_ID}`

/**
 * Seed localStorage with a mock token before navigation.
 * Used for the token-fallback tests where cookie auth fails.
 */
async function seedToken(page: import('@playwright/test').Page) {
  await page.addInitScript(
    ({key, token}) => {
      localStorage.setItem(key, JSON.stringify({token}))
    },
    {key: TOKEN_STORAGE_KEY, token: MOCK_TOKEN},
  )
}

// ── Cookie-first path (default dual behavior) ──────────────────────────────
// cookieProbeSucceeds defaults to true, so these exercise the same path as
// cookie auth — the auth store uses withCredentials and never touches tokens.

test.describe('Dual auth (cookie path): cross-tab sync', () => {
  test.beforeEach(async ({context}) => {
    watchForStudioErrors(context)
  })

  test('logout in one tab reflects in another tab via BroadcastChannel', async ({context}) => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    const page1Auth = await setupMockAuth(page1, {catchAll: true})
    const page2Auth = await setupMockAuth(page2, {catchAll: true})

    await page1.goto(STUDIO_URL)
    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible()

    await page2.goto(STUDIO_URL)
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible()

    page1Auth.logOut()
    page2Auth.logOut()

    await page1.locator('[id="user-menu"]').click()
    await page1.getByText('Sign out').click()

    await expect(
      page1.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()

    await expect(
      page2.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()
  })

  test('login after logout syncs across tabs via BroadcastChannel', async ({context}) => {
    const page1 = await context.newPage()
    const page1Auth = await setupMockAuth(page1, {catchAll: true})

    await page1.goto(STUDIO_URL)
    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible()

    const page2 = await context.newPage()
    const page2Auth = await setupMockAuth(page2, {catchAll: true})
    await page2.goto(STUDIO_URL)
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible()

    // Logout from page2
    page1Auth.logOut()
    page2Auth.logOut()
    await page2.locator('[id="user-menu"]').click()
    await page2.getByText('Sign out').click()

    await expect(
      page2.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()
    await expect(
      page1.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()

    // Simulate login by navigating back (cookie auth flow)
    page1Auth.logIn()
    page2Auth.logIn()
    await page1.goto(STUDIO_URL)

    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible()
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible()
  })

  test('single tab logout shows login screen', async ({context}) => {
    const page = await context.newPage()
    await setupMockAuth(page, {catchAll: true})

    await page.goto(STUDIO_URL)
    await expect(page.locator('[data-testid="studio-navbar"]')).toBeVisible()

    await page.locator('[id="user-menu"]').click()
    await page.getByText('Sign out').click()

    await expect(
      page.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()
  })
})

// ── Token-fallback path ─────────────────────────────────────────────────────
// When cookie auth fails (cookieProbeSucceeds: false), dual mode falls back to
// token-based auth. The auth store reads the token from localStorage and uses
// it in the Authorization header instead of withCredentials.

test.describe('Dual auth (token fallback): cross-tab sync', () => {
  test.beforeEach(async ({context}) => {
    watchForStudioErrors(context)
  })

  test('logout in one tab reflects in another tab via BroadcastChannel', async ({context}) => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    const page1Auth = await setupMockAuth(page1, {cookieProbeSucceeds: false, catchAll: true})
    const page2Auth = await setupMockAuth(page2, {cookieProbeSucceeds: false, catchAll: true})

    await seedToken(page1)
    await seedToken(page2)

    await page1.goto(STUDIO_URL)
    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible()

    await page2.goto(STUDIO_URL)
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible()

    page1Auth.logOut()
    page2Auth.logOut()

    await page1.locator('[id="user-menu"]').click()
    await page1.getByText('Sign out').click()

    await expect(
      page1.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()

    await expect(
      page2.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()
  })

  test('login after logout syncs across tabs via BroadcastChannel', async ({context}) => {
    const page1 = await context.newPage()
    const page1Auth = await setupMockAuth(page1, {cookieProbeSucceeds: false, catchAll: true})
    await seedToken(page1)

    await page1.goto(STUDIO_URL)
    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible()

    const page2 = await context.newPage()
    const page2Auth = await setupMockAuth(page2, {cookieProbeSucceeds: false, catchAll: true})
    await seedToken(page2)
    await page2.goto(STUDIO_URL)
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible()

    // Logout from page2
    page1Auth.logOut()
    page2Auth.logOut()
    await page2.locator('[id="user-menu"]').click()
    await page2.getByText('Sign out').click()

    await expect(
      page2.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()
    await expect(
      page1.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()

    // Simulate login via token exchange: navigate with #sid=<session-id>.
    // The auth store exchanges the SID for a token via GET /auth/fetch?sid=...,
    // stores the token in localStorage, and broadcasts it to other tabs.
    page1Auth.logIn()
    page2Auth.logIn()

    await page1.goto(`${STUDIO_URL}#sid=mock-session-id-12345678`)

    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible()
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible()
  })

  test('single tab logout shows login screen', async ({context}) => {
    const page = await context.newPage()
    await setupMockAuth(page, {cookieProbeSucceeds: false, catchAll: true})
    await seedToken(page)

    await page.goto(STUDIO_URL)
    await expect(page.locator('[data-testid="studio-navbar"]')).toBeVisible()

    await page.locator('[id="user-menu"]').click()
    await page.getByText('Sign out').click()

    await expect(
      page.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()
  })
})
