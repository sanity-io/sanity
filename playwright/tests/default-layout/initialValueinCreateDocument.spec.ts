import {test, expect} from '@playwright/test'

test.describe('@sanity/default-layout: create document with initial value template', () => {
  test.beforeEach(async ({page}) => {
    await Promise.all([
      page.goto('test/desk/'),
      page.locator('data-testid=default-layout-global-create-button').click(),
      page.locator('data-testid=create-document-item-book-by-author').click(),
    ])
  })

  test('will show the right url', async ({page}) => {
    const url = page.url()
    await expect(url).toMatch('template=book-by-author/eyJhdXRob3JJZCI6Imdycm0ifQ')
  })
})
