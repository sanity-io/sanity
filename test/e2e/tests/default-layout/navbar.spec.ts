import {test, expect} from '@playwright/test'

test.describe('@sanity/default-layout: Navbar', () => {
  test('render ActionModal on top of pane headers in desk tool', async ({page}) => {
    page.goto('/test/content')
    await expect(page.locator('data-testid=navbar')).toBeHidden()
  })
})
