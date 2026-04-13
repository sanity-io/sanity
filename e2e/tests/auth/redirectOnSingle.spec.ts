// eslint-disable-next-line no-restricted-imports -- auth tests use raw Playwright (no studio-test fixtures)
import {expect, test} from '@playwright/test'

import {watchForStudioErrors} from '../../helpers/studioErrors'
import {setupMockAuth} from './helpers'

// These workspaces have redirectOnSingle: true with a single provider (GitHub).
// When unauthenticated, the studio should redirect directly to the provider URL
// instead of showing the "Choose login provider" screen.

test.describe('redirectOnSingle', () => {
  test.beforeEach(async ({context}) => {
    watchForStudioErrors(context)
  })

  for (const {name, url} of [
    {name: 'cookie', url: 'http://localhost:3340/cookie-redirectOnSingle'},
    {name: 'token', url: 'http://localhost:3340/token-redirectOnSingle'},
    {name: 'dual', url: 'http://localhost:3340/dual-redirectOnSingle'},
  ]) {
    test(`${name} auth: skips provider chooser and redirects to provider`, async ({context}) => {
      const page = await context.newPage()
      // Start unauthenticated so the login screen would normally appear
      const mock = await setupMockAuth(page, {catchAll: true})
      mock.logOut()

      // Intercept the redirect to the auth provider URL so the browser doesn't
      // actually navigate away. The mock providers return GitHub as the only option.
      let redirectedToProvider = false
      await page.route('**/auth/login/github*', (route) => {
        redirectedToProvider = true
        // Abort the navigation — we just want to verify the redirect happened
        return route.abort()
      })

      await page.goto(url)

      // Wait briefly for the redirect to fire
      await page.waitForTimeout(5000)

      // The "Choose login provider" heading should NOT be visible
      // (either we redirected, or the page is still loading/redirecting)
      expect(redirectedToProvider).toBe(true)
    })
  }

  for (const {name, url} of [
    {name: 'cookie', url: 'http://localhost:3340/cookie'},
    {name: 'token', url: 'http://localhost:3340/token'},
    {name: 'dual', url: 'http://localhost:3340/dual'},
  ]) {
    test(`${name} auth: without redirectOnSingle shows provider chooser`, async ({context}) => {
      const page = await context.newPage()
      const mock = await setupMockAuth(page, {catchAll: true})
      mock.logOut()

      await page.goto(url)

      // Should show the provider chooser screen
      await expect(
        page.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
      ).toBeVisible({timeout: 15_000})
    })
  }
})
