// eslint-disable-next-line no-restricted-imports -- auth tests use raw Playwright (no studio-test fixtures)
import {expect, test} from '@playwright/test'

import {watchForStudioErrors} from '../../helpers/studioErrors'
import {BASE_URL, setupMockAuth} from './helpers'

test.describe('Auth smoke test', () => {
  test.beforeEach(async ({context}) => {
    watchForStudioErrors(context)
  })

  test('studio loads with mocked auth', async ({context}) => {
    const page = await context.newPage()
    await setupMockAuth(page, {catchAll: true})
    await page.goto(`${BASE_URL}/cookie`)
    await expect(page.locator('[data-testid="studio-navbar"]')).toBeVisible()
  })

  test('single tab logout shows login screen', async ({context}) => {
    const page = await context.newPage()
    const mock = await setupMockAuth(page, {catchAll: true})

    await page.goto(`${BASE_URL}/cookie`)
    await expect(page.locator('[data-testid="studio-navbar"]')).toBeVisible()

    mock.logOut()
    await page.locator('[id="user-menu"]').click()
    await page.getByText('Sign out').click()

    await expect(
      page.locator('[data-ui="Heading"]:has-text("Choose login provider")'),
    ).toBeVisible()
  })
})
