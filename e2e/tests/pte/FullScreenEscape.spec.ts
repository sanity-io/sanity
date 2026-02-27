import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Portable Text Input - FullScreen Escape', () => {
  test.beforeEach(async ({page, createDraftDocument}) => {
    test.slow()
    await createDraftDocument('/content/input-standard;portable-text;pt_allTheBellsAndWhistles')

    const pteEditor = page.getByTestId('field-text')
    // Wait for the text block to be editable
    await expect(
      pteEditor.locator('[data-testid="text-block__text"]:not([data-read-only="true"])'),
    ).toBeVisible()

    // Set up the portable text editor
    await pteEditor.focus()
    await pteEditor.click()

    // Make the editor fullscreen
    await expect(
      page.getByTestId('field-text').getByTestId('fullscreen-button-expand'),
    ).toBeVisible()
    await page.getByTestId('field-text').getByTestId('fullscreen-button-expand').click()

    // The collapse button should be visible when the editor is fullscreen
    await expect(page.getByTestId('fullscreen-button-collapse')).toBeVisible()
  })

  test('you should be able to use scape to close full screen mode', async ({page}) => {
    test.slow()

    // Escape should close the fullscreen mode
    await page.keyboard.press('Escape')
    await expect(
      page.getByTestId('field-text').getByTestId('fullscreen-button-expand'),
    ).toBeVisible()
  })

  test('if in fullscreen mode, and having a popover open, escape should close the popover not the fullscreen mode', async ({
    page,
    browserName,
  }) => {
    test.slow()
    test.skip(browserName === 'firefox')

    await page.getByTestId('document-panel-portal').getByRole('textbox').click()
    await page.getByTestId('document-panel-portal').getByRole('textbox').fill('test')

    await page.getByTestId('document-panel-portal').getByRole('textbox').selectText()

    // Open the popover for a link
    await page.getByTestId('document-panel-portal').getByRole('button', {name: 'Link'}).click()
    await expect(page.getByTestId('popover-edit-dialog')).toBeVisible()

    // Escape should close the popover
    await page.keyboard.press('Escape')

    // The popover should be closed
    await expect(page.getByTestId('popover-edit-dialog')).not.toBeVisible()
    // If we can see the collapse button, then we know that the fullscreen mode is still active
    await expect(page.getByTestId('fullscreen-button-collapse')).toBeVisible()
  })
})
