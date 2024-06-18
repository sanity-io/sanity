import {expect} from '@playwright/test'
import {test} from '@sanity/test'

/* 
  Test skipped due to on going developments around server actions that make them flaky 
  Re-enable this test when the server actions are stable 
  */
test.skip(`documents can be restored to an earlier revision`, async ({
  page,
  createDraftDocument,
}) => {
  const titleA = 'Title A'
  const titleB = 'Title B'

  const documentStatus = page.getByTestId('pane-footer-document-status')
  const publishButton = page.getByTestId('action-Publish')
  const restoreButton = page.getByTestId('action-Restore')
  const confirmButton = page.getByTestId('confirm-dialog-confirm-button')
  const timelineMenuOpenButton = page.getByTestId('timeline-menu-open-button')
  const timelineItemButton = page.getByTestId('timeline-item-button')
  const previousRevisionButton = timelineItemButton.nth(2)
  const title = page.getByTestId('document-panel-document-title')
  const titleInput = page.getByTestId('field-title').getByTestId('string-input')

  await createDraftDocument('/test/content/book')
  await titleInput.fill(titleA)

  // Wait for the document to be published.
  await page.waitForTimeout(1_000)
  await publishButton.click()
  await expect(documentStatus).toContainText('Published just now')

  // Change the title.
  await titleInput.fill(titleB)
  await expect(title).toHaveText(titleB)

  // Wait for the document to be published.
  await page.waitForTimeout(1_000)
  await publishButton.click()
  await expect(documentStatus).toContainText('Published just now')

  // Pick the previous revision from the revision timeline.
  await timelineMenuOpenButton.click()
  await expect(previousRevisionButton).toBeVisible()
  await previousRevisionButton.click({force: true})

  await expect(titleInput).toHaveValue(titleA)

  // Wait for the revision to be restored.
  await restoreButton.click()
  await confirmButton.click()
  await expect(title).toHaveText(titleA)
})

/* 
  Test skipped due to on going developments around server actions that make them flaky 
  Re-enable this test when the server actions are stable 
  */
test.skip(`respects overridden restore action`, async ({page, createDraftDocument}) => {
  const titleA = 'Title A'
  const titleB = 'Title B'

  const publishKeypress = () => page.locator('body').press('Control+Alt+p')
  const documentStatus = page.getByTestId('pane-footer-document-status')
  const restoreButton = page.getByTestId('action-Restore')
  const customRestoreButton = page.getByRole('button').getByText('Custom restore')
  const confirmButton = page.getByTestId('confirm-dialog-confirm-button')
  const timelineMenuOpenButton = page.getByTestId('timeline-menu-open-button')
  const timelineItemButton = page.getByTestId('timeline-item-button')
  const previousRevisionButton = timelineItemButton.nth(2)
  const titleInput = page.getByTestId('field-title').getByTestId('string-input')

  await createDraftDocument('/test/content/input-debug;documentActionsTest')

  // waits for the top most form layer to finish loading
  await page.waitForSelector('[data-testid="document-panel-scroller"]', {
    state: 'visible',
  })

  const title = page.getByTestId('document-panel-document-title')
  await titleInput.fill(titleA)

  // Wait for the document to be published.
  //
  // Note: This is invoked using the publish keyboard shortcut, because the publish document action
  // has been overridden for the `documentActionsTest` type, and is not visible without opening the
  // document actions menu.
  await page.waitForTimeout(1_000)
  await publishKeypress()
  await expect(documentStatus).toContainText('Published just now')

  // Change the title.
  await titleInput.fill(titleB)
  await expect(title).toHaveText(titleB)

  // Wait for the document to be published.
  await page.waitForTimeout(1_000)
  await publishKeypress()
  await expect(documentStatus).toContainText('Published just now')

  // Pick the previous revision from the revision timeline.
  await timelineMenuOpenButton.click()
  await expect(previousRevisionButton).toBeVisible()
  await previousRevisionButton.click({force: true})

  await expect(titleInput).toHaveValue(titleA)

  // Ensure the custom restore button is rendered instead of the default restore button.
  await expect(customRestoreButton).toBeVisible()
  await expect(restoreButton).not.toBeVisible()

  // Ensure the custom restore action can invoke the system restore action.
  await customRestoreButton.click()
  await confirmButton.click()

  // Wait for input not to be the previous value.
  await page.waitForFunction(
    ({selector, testTitle}) => {
      const element = document.querySelector(selector) as HTMLElement
      return element && element.textContent !== testTitle
    },
    {selector: '[data-testid="document-panel-document-title"]', testTitle: titleB},
  )

  await expect(title).toHaveText(titleA)
})

/* 
  Test skipped due to on going developments around server actions that make them flaky 
  Re-enable this test when the server actions are stable 
  */
test.skip(`respects removed restore action`, async ({page, createDraftDocument}) => {
  const titleA = 'Title A'
  const titleB = 'Title B'

  const documentStatus = page.getByTestId('pane-footer-document-status')
  const publishButton = page.getByTestId('action-Publish')
  const restoreButton = page.getByTestId('action-Restore')
  const timelineMenuOpenButton = page.getByTestId('timeline-menu-open-button')
  const timelineItemButton = page.getByTestId('timeline-item-button')
  const previousRevisionButton = timelineItemButton.nth(2)
  const title = page.getByTestId('document-panel-document-title')
  const titleInput = page.getByTestId('field-title').getByTestId('string-input')

  await createDraftDocument('/test/content/input-debug;removeRestoreActionTest')
  await titleInput.fill(titleA)

  // Wait for the document to be published.
  await page.waitForTimeout(1_000)
  await publishButton.click()
  await expect(documentStatus).toContainText('Published just now')

  // Change the title.
  await titleInput.fill(titleB)
  await expect(title).toHaveText(titleB)

  // Wait for the document to be published.
  await page.waitForTimeout(1_000)
  await publishButton.click()
  await expect(documentStatus).toContainText('Published just now')

  // Pick the previous revision from the revision timeline.
  await timelineMenuOpenButton.click()
  await expect(previousRevisionButton).toBeVisible()
  await previousRevisionButton.click({force: true})

  await expect(titleInput).toHaveValue(titleA)

  // Ensure the restore button is not displayed.
  await expect(restoreButton).not.toBeVisible()
})

/* 
  Test skipped due to on going developments around server actions that make them flaky 
  Re-enable this test when the server actions are stable 
  */
test.skip(`user defined restore actions should not appear in any other document action group UI`, async ({
  page,
  createDraftDocument,
}) => {
  const actionMenuButton = page.getByTestId('action-menu-button')
  const customRestoreButton = page.getByTestId('action-Customrestore')
  const paneContextMenu = page.locator('[data-ui="MenuButton__popover"]')

  await createDraftDocument('/test/content/input-debug;documentActionsTest')

  await actionMenuButton.click()

  await expect(paneContextMenu).toBeVisible()
  await expect(customRestoreButton).not.toBeVisible()
})
