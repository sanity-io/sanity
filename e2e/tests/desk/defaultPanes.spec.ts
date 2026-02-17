import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('sanity/structure: document pane', () => {
  test('on document with defaultPanes, the panes should be expanded', async ({page}) => {
    await page.goto(`/content/`)
    await page.getByTestId('pane-item-Debug inputs').click({force: true})

    // Scroll down 500px in the virtual list to reveal the "Many views" item
    await page.locator('#input-debug-input-debug-0').evaluate((el) => {
      el.scrollTop = 500
    })

    await page.getByTestId('pane-item-Many views').scrollIntoViewIfNeeded()
    await page.getByTestId('pane-item-Many views').click({force: true})

    await page.getByTestId('action-intent-button').click()
    // It should render the two panes
    await expect(page.getByTestId('document-pane')).toHaveCount(2)
    // The URL contains the expanded pane params (document ID is dynamic)
    await expect(page).toHaveURL(
      /content\/input-debug;manyViews;.*view%3Deditor%2Cexpanded%3Dtrue.*view%3Djson-10/,
    )

    // Go back using browser back button
    await page.goBack()

    // The URL should be the document list without the document panes
    await expect(page).toHaveURL(/content\/input-debug;manyViews$/)
  })
})
