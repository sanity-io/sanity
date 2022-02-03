import {test, expect} from '@playwright/test'

test.describe('@sanity/default-layout: Navbar', () => {
  test('render ActionModal on top of pane headers in desk tool', async ({page}) => {
    page.goto('/test/desk')

    const globalCreateButton = page.locator('data-testid=default-layout-global-create-button')
    const createDialog = page.locator('data-testid=default-layout-global-create-dialog')
    const paneHeader = page.locator('data-testid=pane-header')

    await Promise.all([
      globalCreateButton.click(),
      expect(createDialog).toBeVisible(),
      expect(createDialog).toHaveCSS('z-index', '500801'),
      expect(paneHeader).toHaveCSS('z-index', '201'),
    ])
  })
})
