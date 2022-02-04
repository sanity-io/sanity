import {test, expect} from '@playwright/test'
import {uuid} from '@sanity/uuid'
import {
  createUniqueDocument,
  deleteDocumentsForRun,
  STUDIO_SPACE_NAME,
  testSanityClient,
} from '../../helpers'

/* 
  **NOTE**
  In these tests, we are not testing input events, so to speed up the tests we will use use `page.fill()` instead of `page.type()` to populate the document title field 
*/

const TITLE_PREFIX = '[playwright]'
const inputSelector = 'data-testid=input-title >> input'
const TEST_RUN_ID = uuid()

// The path of the network request we want to wait for
const documentActionPath = (action) =>
  `*/**/mutate/${STUDIO_SPACE_NAME}?tag=sanity.studio.document.${action}*`

// Helper to generate path to document created in a test
const generateDocumentUri = (docId) =>
  `/${STUDIO_SPACE_NAME}/desk/input-ci;documentActionsCI;${docId}`

// Helper to get the path to the document the client creates for a test
async function createDocument(
  _type: string,
  title?: string
): Promise<{studioPath: string; documentId: string}> {
  const testDoc = await createUniqueDocument({runId: TEST_RUN_ID, _type, title})
  return {studioPath: generateDocumentUri(testDoc?._id), documentId: testDoc?._id}
}

test.describe('@sanity/desk-tool: document actions', () => {
  test.afterEach(async ({page}, testInfo) => {
    // After each test, delete the created documents if the test passed
    if (testInfo.status === testInfo.expectedStatus) {
      await testSanityClient.delete(deleteDocumentsForRun('documentActionsCI', TEST_RUN_ID))
    }
  })

  test('edit and publish document', async ({page}, testInfo) => {
    const title = `${TITLE_PREFIX} ${testInfo.title}`
    const publishButton = page.locator('data-testid=action-Publish')
    const {studioPath} = await createDocument('documentActionsCI')
    await page.goto(studioPath)
    await page.fill(inputSelector, title)
    expect(page.locator(inputSelector)).toHaveValue(title)
    expect(publishButton).toBeEnabled()
    expect(publishButton).toHaveAttribute('data-disabled', 'false')

    await Promise.all([page.waitForResponse(documentActionPath('publish')), publishButton.click()])
    await expect(publishButton).toBeDisabled()
    await expect(publishButton).toHaveAttribute('data-disabled', 'true')
  })

  test('unpublish document', async ({page}, testInfo) => {
    const title = `${TITLE_PREFIX} ${testInfo.title}`
    const publishButton = page.locator('data-testid=action-Publish')

    const {studioPath} = await createDocument('documentActionsCI', title)

    await page.goto(studioPath)

    expect(page.locator(inputSelector)).toHaveValue(title)
    await expect(publishButton).toBeDisabled()
    expect(publishButton).toHaveAttribute('data-disabled', 'true')
    page.locator('data-testid=action-menu-button').click()
    page.locator('data-testid=action-Unpublish').click()

    await Promise.all([
      page.waitForResponse(documentActionPath('unpublish')),
      page.locator('data-testid=confirm-unpublish').click(),
    ])

    await expect(publishButton).toBeEnabled()
    await expect(publishButton).toHaveAttribute('data-disabled', 'false')
  })

  test('duplicate document', async ({page}, testInfo) => {
    const title = `${TITLE_PREFIX} ${testInfo.title}`
    const {studioPath} = await createDocument('documentActionsCI', title)

    await page.goto(studioPath)

    expect(page.locator(inputSelector)).toHaveValue(title)
    page.locator('data-testid=action-menu-button').click()

    await Promise.all([
      page.waitForResponse(documentActionPath('duplicate')),
      page.locator('data-testid=action-Duplicate').click(),
    ])
    // Check if we are viewing a new document and not the one created for this test
    await expect(page.url()).not.toMatch(`*${studioPath}`)
  })

  test('delete document', async ({page}, testInfo) => {
    const title = `${TITLE_PREFIX} ${testInfo.title}`
    const publishButton = page.locator('data-testid=action-Publish')

    const {studioPath, documentId} = await createDocument('documentActionsCI', title)

    await page.goto(studioPath)

    expect(page.locator(inputSelector)).toHaveValue(title)
    page.locator('data-testid=action-menu-button').click()
    page.locator('data-testid=action-Delete').click()

    await Promise.all([
      page.waitForResponse(documentActionPath('delete')),
      page.locator('data-testid=confirm-delete').click(),
    ])
    await expect(publishButton).toBeDisabled()
    await expect(publishButton).toHaveAttribute('data-disabled', 'true')
    expect(
      await page.locator(`data-testid=pane-content >> data-testid=pane-item-${documentId}`).count()
    ).toBe(0)
  })
})
