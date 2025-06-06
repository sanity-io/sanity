import {expect} from '@playwright/test'

import {expectCreatedStatus, expectPublishedStatus} from '../../helpers/documentStatusAssertions'
import {test} from '../../studio-test'

test(`documents can be restored to an earlier revision`, async ({page, createDraftDocument}) => {
  test.slow()
  const titleA = 'Title A'
  const titleB = 'Title B'

  const documentStatus = page.getByTestId('pane-footer-document-status')
  const publishButton = page.getByTestId('action-publish')
  const restoreButton = page.getByTestId('action-reverttorevision')
  const confirmButton = page.getByTestId('confirm-dialog-confirm-button')
  const contextMenuButton = page
    .getByTestId('document-pane')
    .getByTestId('pane-context-menu-button')
  const historyMenuButton = page.getByTestId('action-history')
  const historyPane = page.getByLabel('History').getByTestId('scroll-container')

  const timelineItemButton = page.getByTestId('timeline-item-button')
  const previousRevisionButton = timelineItemButton.nth(1)
  const titleInput = page.getByTestId('field-title').getByTestId('string-input')

  await createDraftDocument('/content/book')
  await titleInput.fill(titleA)
  // Wait for the document to finish saving
  await expectCreatedStatus(documentStatus)

  // Wait for the document to be published.
  await publishButton.click()
  await expectPublishedStatus(documentStatus)

  // Change the title.
  await titleInput.fill(titleB)
  await expect(titleInput).toHaveValue(titleB)

  // Wait for the document to be published.
  await page.waitForTimeout(2_000)
  await publishButton.click()
  await expectPublishedStatus(documentStatus)

  // Pick the previous revision from the revision timeline.
  await contextMenuButton.click()
  await expect(contextMenuButton).toBeVisible()
  await historyMenuButton.click()
  await expect(historyPane).toBeVisible()

  await previousRevisionButton.click({force: true})

  await expect(titleInput).toHaveValue(titleA)

  // Wait for the revision to be restored.
  await restoreButton.click()
  await confirmButton.click()
  await expect(titleInput).toHaveValue(titleA)
})

test(`respects overridden restore action`, async ({page, createDraftDocument}) => {
  // trying to avoid flaky test based on shorter timeout
  test.slow()
  const titleA = 'Title A'
  const titleB = 'Title B'

  const publishKeypress = () => page.locator('body').press('Control+Alt+p')
  const documentStatus = page.getByTestId('pane-footer-document-status')
  const restoreButton = page.getByTestId('action-reverttorevision')
  const customRestoreButton = page.getByRole('button').getByText('Custom restore')
  const confirmButton = page.getByTestId('confirm-dialog-confirm-button')
  const contextMenuButton = page
    .getByTestId('document-pane')
    .getByTestId('pane-context-menu-button')
  const historyMenuButton = page.getByTestId('action-history')
  const historyPane = page.getByLabel('History').getByTestId('scroll-container')

  const timelineItemButton = page.getByTestId('timeline-item-button')
  const previousRevisionButton = timelineItemButton.nth(1)
  const titleInput = page.getByTestId('field-title').getByTestId('string-input')

  await createDraftDocument('/content/input-debug;documentActionsTest')

  // waits for the top most form layer to finish loading
  await page.waitForSelector('[data-testid="document-panel-scroller"]', {
    state: 'visible',
  })

  await titleInput.fill(titleA)
  // Wait for the document to finish saving
  await expectCreatedStatus(documentStatus)

  // Wait for the document to be published.
  //
  // Note: This is invoked using the publish keyboard shortcut, because the publish document action
  // has been overridden for the `documentActionsTest` type, and is not visible without opening the
  // document actions menu.
  await publishKeypress()
  await expectPublishedStatus(documentStatus)

  // Change the title.
  await titleInput.fill(titleB)
  await expect(titleInput).toHaveValue(titleB)

  // Wait for the document to be published.
  await page.waitForTimeout(2_000)
  await publishKeypress()
  await expectPublishedStatus(documentStatus)

  // Pick the previous revision from the revision timeline.
  await contextMenuButton.click()
  await expect(contextMenuButton).toBeVisible()
  await historyMenuButton.click()
  await expect(historyPane).toBeVisible()
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

  await expect(titleInput).toHaveValue(titleA)
})

test(`respects removed restore action`, async ({page, createDraftDocument}) => {
  const titleA = 'Title A'
  const titleB = 'Title B'

  const documentStatus = page.getByTestId('pane-footer-document-status')
  const publishButton = page.getByTestId('action-publish')
  const restoreButton = page.getByTestId('action-reverttorevision')
  const contextMenuButton = page
    .getByTestId('document-pane')
    .getByTestId('pane-context-menu-button')
  const historyMenuButton = page.getByTestId('action-history')
  const historyPane = page.getByLabel('History').getByTestId('scroll-container')

  const timelineItemButton = page.getByTestId('timeline-item-button')
  const previousRevisionButton = timelineItemButton.nth(1)
  const titleInput = page.getByTestId('field-title').getByTestId('string-input')

  await createDraftDocument('/content/input-debug;removeRestoreActionTest')
  await titleInput.fill(titleA)
  // Wait for the document to finish saving
  await expectCreatedStatus(documentStatus)

  // Wait for the document to be published.
  await publishButton.click()
  await expectPublishedStatus(documentStatus)

  // Change the title.
  await titleInput.fill(titleB)
  await expect(titleInput).toHaveValue(titleB)

  // Wait for the document to be published.
  await page.waitForTimeout(2_000)
  await publishButton.click()
  await expectPublishedStatus(documentStatus)

  // Pick the previous revision from the revision timeline.
  await contextMenuButton.click()
  await expect(contextMenuButton).toBeVisible()
  await historyMenuButton.click()
  await expect(historyPane).toBeVisible()
  await previousRevisionButton.click({force: true})

  await expect(titleInput).toHaveValue(titleA)

  // Ensure the restore button is not displayed.
  await expect(restoreButton).not.toBeVisible()
})

test(`user defined restore actions should not appear in any other document action group UI`, async ({
  page,
  createDraftDocument,
}) => {
  const actionMenuButton = page.getByTestId('action-menu-button')
  const customRestoreButton = page.getByTestId('action-Customrestore')
  const paneContextMenu = page.locator('[data-ui="MenuButton__popover"]')

  await createDraftDocument('/content/input-debug;documentActionsTest')

  await actionMenuButton.click()

  await expect(paneContextMenu).toBeVisible()
  await expect(customRestoreButton).not.toBeVisible()
})
