// eslint-disable-next-line no-restricted-imports -- auth tests use raw Playwright (no studio-test fixtures)
import {expect, test} from '@playwright/test'

import {watchForStudioErrors} from '../../helpers/studioErrors'
import {BASE_URL, setupMockAuth} from './helpers'

// SSO workspaces use createAuthStore with a single SAML provider replacing
// the default providers. When unauthenticated, the login screen should show
// the SAML provider button. With redirectOnSingle, it should redirect directly.

test.describe('SSO', () => {
  test.beforeEach(async ({context}) => {
    watchForStudioErrors(context)
  })

  for (const {name, path} of [
    {name: 'cookie', path: 'sso-cookie'},
    {name: 'token', path: 'sso-token'},
    {name: 'dual', path: 'sso-dual'},
  ]) {
    test(`${name} auth: shows SSO provider in login screen`, async ({context}) => {
      const page = await context.newPage()
      const mock = await setupMockAuth(page, {catchAll: true})
      mock.logOut()

      await page.goto(`${BASE_URL}/${path}`)

      // The login screen should show the SAML provider button
      await expect(page.locator('text=saml')).toBeVisible({timeout: 15_000})
    })
  }

  for (const {name, path} of [
    {name: 'cookie', path: 'sso-cookie-redirectOnSingle'},
    {name: 'token', path: 'sso-token-redirectOnSingle'},
    {name: 'dual', path: 'sso-dual-redirectOnSingle'},
  ]) {
    test(`${name} auth: SSO + redirectOnSingle redirects to SAML provider`, async ({context}) => {
      const page = await context.newPage()
      const mock = await setupMockAuth(page, {catchAll: true})
      mock.logOut()

      await page.goto(`${BASE_URL}/${path}`)

      // Should redirect directly to the SAML SSO login URL
      await page.waitForURL('**/auth/saml/login/**', {timeout: 15_000})
    })
  }
})
