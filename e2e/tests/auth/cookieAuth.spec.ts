// eslint-disable-next-line no-restricted-imports -- auth tests use raw Playwright (no studio-test fixtures)
import {expect, type Page, test} from '@playwright/test'

// The auth-test-studio uses projectId: 'ppsg7ml5' with production API (api.sanity.io)
// and loginMethod: 'cookie'. We mock all API responses so no real credentials are needed.
const STUDIO_URL = 'http://localhost:3341'

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

const MOCK_AUTH_PROBE = {
  id: 'mock-user-123',
  expiry: Math.floor(Date.now() / 1000) + 3600,
}

/**
 * Set up route mocks for an authenticated user.
 * Returns an object with a `logOut` method that switches /users/me to return 401.
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

  // Mock /auth/id probe
  await page.route('**/auth/id*', (route) => {
    if (authenticated) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AUTH_PROBE),
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

  // Mock /auth/logout
  await page.route('**/auth/logout*', (route) => {
    authenticated = false
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ok: true}),
    })
  })

  // Block trial/journey dialog
  await page.route('**/journey/trial**', (route) =>
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

test.describe('Cookie auth: cross-tab sync', () => {
  test('logout in one tab reflects in another tab via BroadcastChannel', async ({browser}) => {
    // Use a single browser context so both pages share BroadcastChannel and cookies
    const context = await browser.newContext({
      viewport: {width: 1728, height: 1000},
      reducedMotion: 'reduce',
    })

    const page1 = await context.newPage()
    const page2 = await context.newPage()

    // Set up authenticated mocks for both pages
    const page1Auth = await setupMockAuth(page1)
    const page2Auth = await setupMockAuth(page2)

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
    // Note: Sanity UI's <Heading> renders as a <div>, not an <h1>–<h6>,
    // so we use a data-ui selector + text match instead of getByRole("heading")
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

    await context.close()
  })

  test('login after logout syncs across tabs via BroadcastChannel', async ({browser}) => {
    const context = await browser.newContext({
      viewport: {width: 1728, height: 1000},
      reducedMotion: 'reduce',
    })

    const page1 = await context.newPage()
    const page1Auth = await setupMockAuth(page1)

    // 1. Load page1 first and wait for it to be fully authenticated
    await page1.goto(STUDIO_URL)
    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible({
      timeout: 30_000,
    })

    // 2. Then load page2 — sequential to avoid broadcast race during init
    const page2 = await context.newPage()
    const page2Auth = await setupMockAuth(page2)
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

    // 4. Simulate login in page1 by navigating back to the studio.
    //    With cookie auth, the server sets the cookie during the provider redirect,
    //    so the studio loads fresh and /users/me returns the authenticated user.
    page1Auth.logIn()
    page2Auth.logIn()
    await page1.goto(STUDIO_URL)

    // Page1 should be authenticated again (navbar visible)
    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible({
      timeout: 30_000,
    })

    // Page2 should also become authenticated via BroadcastChannel sync
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible({
      timeout: 30_000,
    })

    await context.close()
  })

  test('single tab logout shows login screen', async ({browser}) => {
    const context = await browser.newContext({
      viewport: {width: 1728, height: 1000},
      reducedMotion: 'reduce',
    })

    const page = await context.newPage()
    await setupMockAuth(page)

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

    await context.close()
  })
})
