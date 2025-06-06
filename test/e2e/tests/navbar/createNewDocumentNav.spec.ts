import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test('create new document from menu button', async ({page, baseURL}) => {
  await page.goto(baseURL ?? '/content')
  await page.getByLabel('Create new document').click()
  await page.getByTestId('new-document-button-search-input').fill('Author')
  const authorLink = await page.getByTestId('create-new-author')

  expect(authorLink).toBeVisible()

  // Forcing due to aria-hidden=true
  // https://github.com/sanity-io/sanity/blob/6d5b4e88c4cb0fbd41fcebbaebabd88e9fac16b5/packages/sanity/src/core/components/commandList/CommandList.tsx#L596
  await page.getByTestId('create-new-author').click({force: true})

  await page.waitForSelector('data-testid=document-pane')

  expect(page.url()).toMatch(/(chromium|firefox)\/content\/author;[0-9a-fA-F-]/)
})
