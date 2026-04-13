// eslint-disable-next-line no-restricted-imports -- auth tests use raw Playwright (no studio-test fixtures)
import {expect, test} from '@playwright/test'

import {watchForStudioErrors} from '../../helpers/studioErrors'
import {BASE_URL, setupMockAuth} from './helpers'

// Dual auth (loginMethod: 'dual') tries cookie first, falls back to token.
// The auth store uses withCredentials (cookies) when available, and stores
// a token in localStorage as fallback.
const STUDIO_URL = `${BASE_URL}/dual`

test.describe('Dual auth: cross-tab sync', () => {
  test.beforeEach(async ({context}) => {
    watchForStudioErrors(context)
  })

  test('logout in one tab reflects in another tab via BroadcastChannel', async ({context}) => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    const page1Auth = await setupMockAuth(page1, {catchAll: true})
    const page2Auth = await setupMockAuth(page2, {catchAll: true})

    await page1.goto(STUDIO_URL)
    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible({timeout: 30_000})

    await page2.goto(STUDIO_URL)
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible({timeout: 30_000})

    page1Auth.logOut()
    page2Auth.logOut()

    await page1.locator('[id="user-menu"]').click()
    await page1.getByText('Sign out').click()

    await expect(
      page1.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible({timeout: 15_000})

    await expect(
      page2.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible({timeout: 15_000})
  })

  test('login after logout syncs across tabs via BroadcastChannel', async ({context}) => {
    const page1 = await context.newPage()
    const page1Auth = await setupMockAuth(page1, {catchAll: true})

    await page1.goto(STUDIO_URL)
    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible({timeout: 30_000})

    const page2 = await context.newPage()
    const page2Auth = await setupMockAuth(page2, {catchAll: true})
    await page2.goto(STUDIO_URL)
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible({timeout: 30_000})

    // Logout from page2
    page1Auth.logOut()
    page2Auth.logOut()
    await page2.locator('[id="user-menu"]').click()
    await page2.getByText('Sign out').click()

    await expect(
      page2.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible({timeout: 15_000})
    await expect(
      page1.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible({timeout: 15_000})

    // Simulate login by navigating back (cookie auth flow)
    page1Auth.logIn()
    page2Auth.logIn()
    await page1.goto(STUDIO_URL)

    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible({timeout: 30_000})
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible({timeout: 30_000})
  })

  test('single tab logout shows login screen', async ({context}) => {
    const page = await context.newPage()
    await setupMockAuth(page, {catchAll: true})

    await page.goto(STUDIO_URL)
    await expect(page.locator('[data-testid="studio-navbar"]')).toBeVisible({timeout: 30_000})

    await page.locator('[id="user-menu"]').click()
    await page.getByText('Sign out').click()

    await expect(page.locator('[data-ui="Heading"]:has-text("Choose login provider")')).toBeVisible(
      {timeout: 15_000},
    )
  })
})
