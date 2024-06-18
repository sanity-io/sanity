import {expect, type Page} from '@playwright/test'
import {test} from '@sanity/test'

test.describe('Portable Text Input - Open Block Style Select', () => {
  test.beforeEach(async ({page, createDraftDocument}) => {
    await createDraftDocument(
      '/test/content/input-standard;portable-text;pt_allTheBellsAndWhistles',
    )

    // wait for form to be ready
    await expect(page.getByTestId('document-panel-scroller')).toBeAttached({timeout: 40000})

    // set up the portable text editor
    await page.getByTestId('field-content').focus()
    await page.getByTestId('field-content').click()

    // wait for overlay to be gone
    await page
      .getByTestId('field-content')
      .getByTestId('activate-overlay')
      .waitFor({state: 'hidden'})
  })

  test('on a simple editor', async ({page}) => {
    await page.getByTestId('field-content').getByTestId('block-style-select').click()

    page.on('dialog', async () => {
      expect(await page.locator('[data-ui="MenuButton__popover"]')).toBeVisible()
    })
  })

  test('on a full screen simple editor', async ({page}) => {
    await page.getByTestId('field-content').getByLabel('Expand editor').click()

    // wait for PTE to be full screen
    await waitForFullScreen(page)

    await page.locator('[data-testid="block-style-select"]').click()

    page.on('dialog', async () => {
      await expect(await page.locator('[data-ui="MenuButton__popover"]')).toBeVisible()
    })
  })

  test('on a full screen multi nested PTE', async ({page}) => {
    await page.getByTestId('field-content').getByLabel('Expand editor').click()

    // wait for PTE to be full screen
    await waitForFullScreen(page)

    // add a object with a nested PTE
    await page.getByRole('button', {name: 'Insert Nested (inline)'}).click()

    // click the block
    await page.getByTestId('pt-inline-object').click()

    // set up object
    await page.getByTestId('add-single-object-button').click()

    // set up nested PTE
    const nestedPTE = page.locator('[data-testid^="field-content"][data-testid$=".deep"]')

    await nestedPTE.focus()
    await nestedPTE.click()

    // nested block full screen
    await nestedPTE.getByLabel('Expand editor').click()

    // wait for PTE to be full screen
    await waitForFullScreen(page)

    // click the block style select
    await page.locator('[data-testid="block-style-select"]').nth(1).click()

    page.on('dialog', async () => {
      await expect(await page.locator('[data-ui="MenuButton__popover"]')).toBeVisible()
    })
  })
})

// wait for PTE to be full screen
async function waitForFullScreen(page: Page) {
  return await page
    .getByTestId('document-panel-portal')
    .evaluate((element) => element.children.length > 0)
}
