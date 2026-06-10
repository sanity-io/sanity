// eslint-disable-next-line no-restricted-imports -- auth tests use raw Playwright (no studio-test fixtures)
import {expect, test} from '@playwright/test'

import {watchForStudioErrors} from '../../helpers/studioErrors'
import {BASE_URL, setupMockAuth} from './helpers'

const STUDIO_URL = `${BASE_URL}/cookie`

test.describe('Cookie auth: cross-tab sync', () => {
  test.beforeEach(async ({context}) => {
    watchForStudioErrors(context)
  })

  test('logout in one tab reflects in another tab via BroadcastChannel', async ({context}) => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    // Set up authenticated mocks for both pages
    const page1Auth = await setupMockAuth(page1, {catchAll: true})
    const page2Auth = await setupMockAuth(page2, {catchAll: true})

    // Load tabs sequentially to avoid broadcast races during init
    await page1.goto(STUDIO_URL)
    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible()

    await page2.goto(STUDIO_URL)
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible()

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
    ).toBeVisible()

    // Page2 should also show login screen via BroadcastChannel sync
    await expect(
      page2.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()
  })

  test('login after logout syncs across tabs via BroadcastChannel', async ({context}) => {
    const page1 = await context.newPage()
    const page1Auth = await setupMockAuth(page1, {catchAll: true})

    // 1. Load page1 first and wait for it to be fully authenticated
    await page1.goto(STUDIO_URL)
    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible()

    // 2. Then load page2 — sequential to avoid broadcast race during init
    const page2 = await context.newPage()
    const page2Auth = await setupMockAuth(page2, {catchAll: true})
    await page2.goto(STUDIO_URL)
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible()

    // 3. Logout from page2
    page1Auth.logOut()
    page2Auth.logOut()
    await page2.locator('[id="user-menu"]').click()
    await page2.getByText('Sign out').click()

    // Both tabs should show the login screen
    await expect(
      page2.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()
    await expect(
      page1.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()

    // 4. Simulate login in page1 by navigating back to the studio.
    //    With cookie auth, the server sets the cookie during the provider redirect,
    //    so the studio loads fresh and /users/me returns the authenticated user.
    page1Auth.logIn()
    page2Auth.logIn()
    await page1.goto(STUDIO_URL)

    // Page1 should be authenticated again (navbar visible)
    await expect(page1.locator('[data-testid="studio-navbar"]')).toBeVisible()

    // Page2 should also become authenticated via BroadcastChannel sync
    await expect(page2.locator('[data-testid="studio-navbar"]')).toBeVisible()
  })

  test('single tab logout shows login screen', async ({context}) => {
    const page = await context.newPage()
    await setupMockAuth(page, {catchAll: true})

    await page.goto(STUDIO_URL)
    await expect(page.locator('[data-testid="studio-navbar"]')).toBeVisible()

    // Open user menu and click "Sign out"
    await page.locator('[id="user-menu"]').click()
    await page.getByText('Sign out').click()

    // Should show the login screen
    await expect(
      page.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()
  })
})
