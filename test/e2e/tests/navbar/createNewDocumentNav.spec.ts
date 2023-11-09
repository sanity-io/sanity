import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test('create new document from menu button', async ({page, baseURL}) => {
  await page.goto(baseURL ?? '/test/content')
  await page.getByLabel('Create new document').click()
  await page.getByTestId('new-document-button-search-input').fill('Author')
  const authorLink = await page.getByRole('link', {name: 'Author', exact: true})

  expect(authorLink).toBeVisible()

  // Forcing due to aria-hidden=true
  // https://github.com/sanity-io/sanity/blob/next/packages/sanity/src/core/components/commandList/CommandList.tsx
  await page.getByRole('link', {name: 'Author', exact: true}).click({force: true})

  await page.waitForSelector('data-testid=document-pane')

  expect(page.url()).toMatch(/test\/content\/author;[0-9a-fA-F-]/)
})
