// eslint-disable-next-line no-restricted-imports -- auth tests use raw Playwright (no studio-test fixtures)
import {expect, test} from '@playwright/test'

import {watchForStudioErrors} from '../../helpers/studioErrors'
import {BASE_URL, setupMockAuth} from './helpers'

// These workspaces have redirectOnSingle: true with a single provider (GitHub).
// When unauthenticated, the studio should redirect directly to the provider URL
// instead of showing the "Choose login provider" screen.
//
// The redirect uses window.location.href, which triggers a full page navigation
// to the auth provider. We detect this by waiting for the URL to change.

test.describe('redirectOnSingle', () => {
  test.beforeEach(async ({context}) => {
    watchForStudioErrors(context)
  })

  for (const {name, path} of [
    {name: 'cookie', path: 'cookie-redirectOnSingle'},
    {name: 'token', path: 'token-redirectOnSingle'},
    {name: 'dual', path: 'dual-redirectOnSingle'},
  ]) {
    test(`${name} auth: skips provider chooser and redirects to provider`, async ({context}) => {
      const page = await context.newPage()
      const mock = await setupMockAuth(page, {catchAll: true})
      mock.logOut()

      await page.goto(`${BASE_URL}/${path}`)

      // The studio should redirect to the GitHub auth URL (the only provider).
      await page.waitForURL('**/auth/login/github*')
    })
  }

  for (const {name, path} of [
    {name: 'cookie', path: 'cookie'},
    {name: 'token', path: 'token'},
    {name: 'dual', path: 'dual'},
  ]) {
    test(`${name} auth: without redirectOnSingle shows provider chooser`, async ({context}) => {
      const page = await context.newPage()
      const mock = await setupMockAuth(page, {catchAll: true})
      mock.logOut()

      await page.goto(`${BASE_URL}/${path}`)

      await expect(
        page.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
      ).toBeVisible()
    })
  }

  // FIXME: after logout, redirectOnSingle should NOT redirect to the auth provider.
  // Redirecting after logout effectively logs the user back in, which defeats the
  // purpose of logging out (e.g. to switch accounts). The login screen should be
  // shown instead. Currently the LoginComponent always redirects when
  // redirectOnSingle is true and there's only one provider.
  for (const {name, path} of [
    {name: 'cookie', path: 'cookie-redirectOnSingle'},
    {name: 'token', path: 'token-redirectOnSingle'},
    {name: 'dual', path: 'dual-redirectOnSingle'},
  ]) {
    test.fixme(`${name} auth: logout with redirectOnSingle shows login screen instead of redirecting`, async ({
      context,
    }) => {
      const page = await context.newPage()
      const mock = await setupMockAuth(page, {catchAll: true})

      await page.goto(`${BASE_URL}/${path}`)
      await expect(page.locator('[data-testid="studio-navbar"]')).toBeVisible()

      mock.logOut()
      await page.locator('[id="user-menu"]').click()
      await page.getByText('Sign out').click()

      // After logout, the login screen should appear — NOT a redirect to the provider.
      await expect(
        page.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
      ).toBeVisible()

      // Verify the URL stayed on localhost (no redirect to auth provider)
      expect(page.url()).toContain('localhost:3340')
    })
  }
})
