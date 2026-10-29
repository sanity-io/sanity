import {expect, type Page} from '@playwright/test'

import {expectSavedStatus} from '../../helpers/documentStatusAssertions'
import {test} from '../../studio-test'
import {partialASAPReleaseMetadata} from '../releases/utils/__fixtures__/releases'
import {
  archiveAndDeleteRelease,
  createDocument,
  createRelease,
  getRandomReleaseId,
  skipIfBrowser,
} from '../releases/utils/methods'

/**
 * Navigates to a new species draft, types a name to persist it, and waits for the save to
 * complete before continuing.
 */
async function createSpeciesDocument(
  page: Page,
  createDraftDocument: (navigationPath: string) => Promise<string>,
) {
  await createDraftDocument('/content/species')

  const nameInput = page.locator('#name')
  await expect(nameInput).toBeVisible({timeout: 30_000})
  await expect(nameInput).toBeEnabled()
  await nameInput.fill(`Tasks e2e species ${Date.now()}`)

  await expectSavedStatus(page.getByTestId('pane-footer'), {timeout: 30_000})
}

/**
 * Opens the tasks sidebar from the navbar. The first use in a fresh dataset may create the
 * tasks addon dataset, so the readiness check gets a generous timeout.
 */
async function openTasksSidebar(page: Page) {
  await page.getByTestId('tasks-toolbar').click()
  // `exact` avoids also matching the empty state's "Create new task" button.
  await expect(page.getByRole('button', {name: 'New task', exact: true})).toBeVisible({
    timeout: 30_000,
  })
}

/**
 * Creates a task with the given title through the sidebar form. The target document is
 * pre-populated with the active document. After a successful creation the sidebar
 * automatically switches to the "Subscribed" tab, where the new task is listed.
 */
async function createTask(page: Page, title: string) {
  await page.getByRole('button', {name: 'New task', exact: true}).click()
  const titleInput = page.getByPlaceholder('Task title')
  await expect(titleInput).toBeVisible({timeout: 30_000})
  // The active document is picked up with a debounce; wait for the target field to be
  // pre-populated so the task is created with the (version-aware) document target.
  await expect(page.getByTestId('task-target-field-preview')).toBeVisible({timeout: 30_000})
  await titleInput.fill(title)
  await page.getByRole('button', {name: 'Create Task'}).click()
  await expect(page.getByTestId('tasks-list-item').filter({hasText: title})).toBeVisible({
    timeout: 30_000,
  })
}

test.describe('Tasks', () => {
  test.beforeEach(({browserName}) => {
    skipIfBrowser(browserName)
  })

  test('creates a task targeting the active document', async ({page, createDraftDocument}) => {
    await createSpeciesDocument(page, createDraftDocument)

    const title = `Task e2e create ${Date.now()}`

    await openTasksSidebar(page)
    await createTask(page, title)

    // The task targets the open document, so the "Active Document" tab lists it and the
    // document footer counts it.
    await page.getByRole('tab', {name: 'Active Document'}).click()
    await expect(page.getByTestId('tasks-list-item').filter({hasText: title})).toBeVisible()
    await expect(page.getByRole('button', {name: '1 open task'})).toBeVisible()
  })

  test('creates a task for a release version document and scopes it to that version', async ({
    page,
    sanityClient,
    _testContext,
  }) => {
    const releaseId = getRandomReleaseId()
    const dataset = sanityClient.config().dataset

    await createRelease({
      sanityClient,
      dataset,
      releaseId,
      metadata: partialASAPReleaseMetadata,
    })

    try {
      const docId = _testContext.getUniqueDocumentId()
      // A draft and a release version of the same document, so both perspectives display a
      // real document of their own.
      await createDocument(sanityClient, {
        _type: 'species',
        name: 'Tasks e2e draft',
        _id: `drafts.${docId}`,
      })
      await createDocument(sanityClient, {
        _type: 'species',
        name: 'Tasks e2e release version',
        _id: `versions.${releaseId}.${docId}`,
      })

      // Create the task while the release version of the document is displayed: its target
      // stores the version id, scoping it to that exact version document.
      await page.goto(`/content/species;${docId}?perspective=${releaseId}`)
      await expect(page.locator('[data-testid="form-view"]')).toBeVisible({timeout: 30_000})

      const title = `Task e2e release ${Date.now()}`
      await openTasksSidebar(page)
      await createTask(page, title)

      await page.getByRole('tab', {name: 'Active Document'}).click()
      await expect(page.getByTestId('tasks-list-item').filter({hasText: title})).toBeVisible()
      await expect(page.getByRole('button', {name: '1 open task'})).toBeVisible()

      // The draft of the same document must not list the version-scoped task.
      await page.goto(`/content/species;${docId}`)
      await expect(page.locator('[data-testid="form-view"]')).toBeVisible({timeout: 30_000})

      await openTasksSidebar(page)
      await page.getByRole('tab', {name: 'Active Document'}).click()
      // Waiting for the loaded empty state ensures the list has resolved before the negative
      // assertions below.
      await expect(page.getByText("This document doesn't have any tasks yet")).toBeVisible({
        timeout: 30_000,
      })
      await expect(page.getByTestId('tasks-list-item').filter({hasText: title})).not.toBeVisible()
      await expect(page.getByRole('button', {name: '1 open task'})).not.toBeVisible()
    } finally {
      await archiveAndDeleteRelease({sanityClient, dataset, releaseId})
    }
  })

  test('resolves a task from the tasks list', async ({page, createDraftDocument}) => {
    await createSpeciesDocument(page, createDraftDocument)
    const title = `Task e2e resolve ${Date.now()}`

    await openTasksSidebar(page)
    await createTask(page, title)

    const taskItem = page.getByTestId('tasks-list-item').filter({hasText: title})
    await taskItem.getByRole('checkbox').click()

    // The resolved task moves out of the "To Do" section into the collapsed "Done" section.
    await expect(taskItem).not.toBeVisible()
    await page.getByText('Done', {exact: true}).click()
    await expect(page.getByTestId('tasks-list-item').filter({hasText: title})).toBeVisible()
  })
})
