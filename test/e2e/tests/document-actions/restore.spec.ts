import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test(`documents can be restored to an earlier revision`, async ({page, createDraftDocument}) => {
  test.slow()
  const titleA = 'Title A'
  const titleB = 'Title B'

  const getDocumentStatus = () => page.getByTestId('pane-footer-document-status')
  const getPublishButton = () => page.getByTestId('action-publish')
  const getRestoreButton = () => page.getByTestId('action-reverttorevision')
  const getConfirmButton = () => page.getByTestId('confirm-dialog-confirm-button')
  const getContextMenuButton = () =>
    page.getByTestId('document-pane').getByTestId('pane-context-menu-button')
  const getHistoryMenuButton = () => page.getByTestId('action-history')
  const getHistoryPane = () => page.getByLabel('History').getByTestId('scroll-container')
  const getTimelineItemButton = () => page.getByTestId('timeline-item-button')
  const getTitleInput = () => page.getByTestId('field-title').getByTestId('string-input')

  await createDraftDocument('/test/content/book')
  await getTitleInput().fill(titleA)
  // Wait for the document to finish saving
  await expect(getDocumentStatus()).toContainText(/created/i, {useInnerText: true, timeout: 60_000})

  // Wait for the document to be published.
  await getPublishButton().click()
  await expect(getDocumentStatus()).toContainText('Published just now')

  // Change the title.
  await getTitleInput().fill(titleB)
  await expect(getTitleInput()).toHaveValue(titleB)

  // Wait for the document to be published.
  await page.waitForTimeout(2_000)
  await getPublishButton().click()
  await expect(getDocumentStatus()).toContainText('Published just now')

  // Pick the previous revision from the revision timeline.
  await getContextMenuButton().click()
  await expect(getContextMenuButton()).toBeVisible()
  await getHistoryMenuButton().click()
  await expect(getHistoryPane()).toBeVisible()

  await getTimelineItemButton().nth(1).click({force: true})

  await expect(getTitleInput()).toHaveValue(titleA)

  // Wait for the revision to be restored.
  await getRestoreButton().click()
  await getConfirmButton().click()
  await expect(getTitleInput()).toHaveValue(titleA)
})

test(`respects overridden restore action`, async ({page, createDraftDocument}) => {
  // trying to avoid flaky test based on shorter timeout
  test.slow()
  const titleA = 'Title A'
  const titleB = 'Title B'

  const publishKeypress = () => page.locator('body').press('Control+Alt+p')
  const getDocumentStatus = () => page.getByTestId('pane-footer-document-status')
  const getCustomRestoreButton = () => page.getByRole('button').getByText('Custom restore')
  const getConfirmButton = () => page.getByTestId('confirm-dialog-confirm-button')
  const getContextMenuButton = () =>
    page.getByTestId('document-pane').getByTestId('pane-context-menu-button')
  const getHistoryMenuButton = () => page.getByTestId('action-history')
  const getHistoryPane = () => page.getByLabel('History').getByTestId('scroll-container')
  const getTimelineItemButton = () => page.getByTestId('timeline-item-button')
  const getTitleInput = () => page.getByTestId('field-title').getByTestId('string-input')

  await createDraftDocument('/test/content/input-debug;documentActionsTest')

  // waits for the top most form layer to finish loading
  await page.waitForSelector('[data-testid="document-panel-scroller"]', {
    state: 'visible',
  })

  await getTitleInput().fill(titleA)
  // Wait for the document to finish saving
  await expect(getDocumentStatus()).toContainText(/created/i, {useInnerText: true, timeout: 30_000})

  // Wait for the document to be published.
  //
  // Note: This is invoked using the publish keyboard shortcut, because the publish document action
  // has been overridden for the `documentActionsTest` type, and is not visible without opening the
  // document actions menu.
  await publishKeypress()
  await expect(getDocumentStatus()).toContainText('Published just now')

  // Change the title.
  await getTitleInput().fill(titleB)
  await expect(getTitleInput()).toHaveValue(titleB)

  // Wait for the document to be published.
  await page.waitForTimeout(2_000)
  await publishKeypress()
  await expect(getDocumentStatus()).toContainText('Published just now')

  // Pick the previous revision from the revision timeline.
  await getContextMenuButton().click()
  await expect(getContextMenuButton()).toBeVisible()
  await getHistoryMenuButton().click()
  await expect(getHistoryPane()).toBeVisible()
  await getTimelineItemButton().nth(1).click({force: true})

  await expect(getTitleInput()).toHaveValue(titleA)

  // Wait for the custom restore button to be displayed and click it.
  await getCustomRestoreButton().click()
  await getConfirmButton().click()

  // Wait for input not to be the previous value.
  await page.waitForFunction(
    ({selector, testTitle}) => {
      const element = document.querySelector(selector) as HTMLElement
      return element && element.textContent !== testTitle
    },
    {selector: '[data-testid="document-panel-document-title"]', testTitle: titleB},
  )

  await expect(getTitleInput()).toHaveValue(titleA)
})

test(`respects removed restore action`, async ({page, createDraftDocument}) => {
  const titleA = 'Title A'
  const titleB = 'Title B'

  const getDocumentStatus = () => page.getByTestId('pane-footer-document-status')
  const getPublishButton = () => page.getByTestId('action-publish')
  const getRestoreButton = () => page.getByTestId('action-reverttorevision')
  const getContextMenuButton = () =>
    page.getByTestId('document-pane').getByTestId('pane-context-menu-button')
  const getHistoryMenuButton = () => page.getByTestId('action-history')
  const getHistoryPane = () => page.getByLabel('History').getByTestId('scroll-container')
  const getTimelineItemButton = () => page.getByTestId('timeline-item-button')
  const getTitleInput = () => page.getByTestId('field-title').getByTestId('string-input')

  await createDraftDocument('/test/content/input-debug;removeRestoreActionTest')
  await getTitleInput().fill(titleA)
  // Wait for the document to finish saving
  await expect(getDocumentStatus()).toContainText(/created/i, {useInnerText: true, timeout: 30_000})

  // Wait for the document to be published.
  await getPublishButton().click()
  await expect(getDocumentStatus()).toContainText('Published just now')

  // Change the title.
  await getTitleInput().fill(titleB)
  await expect(getTitleInput()).toHaveValue(titleB)

  // Wait for the document to be published.
  await page.waitForTimeout(2_000)
  await getPublishButton().click()
  await expect(getDocumentStatus()).toContainText('Published just now')

  // Pick the previous revision from the revision timeline.
  await getContextMenuButton().click()
  await expect(getContextMenuButton()).toBeVisible()
  await getHistoryMenuButton().click()
  await expect(getHistoryPane()).toBeVisible()
  await getTimelineItemButton().nth(1).click({force: true})

  await expect(getTitleInput()).toHaveValue(titleA)

  // Ensure the restore button is not displayed.
  await expect(getRestoreButton()).not.toBeVisible()
})

test(`user defined restore actions should not appear in any other document action group UI`, async ({
  page,
  createDraftDocument,
}) => {
  const getActionMenuButton = () => page.getByTestId('action-menu-button')
  const getCustomRestoreButton = () => page.getByTestId('action-Customrestore')
  const getPaneContextMenu = () => page.locator('[data-ui="MenuButton__popover"]')

  await createDraftDocument('/test/content/input-debug;documentActionsTest')

  await getActionMenuButton().click()

  await expect(getPaneContextMenu()).toBeVisible()
  await expect(getCustomRestoreButton()).not.toBeVisible()
})
