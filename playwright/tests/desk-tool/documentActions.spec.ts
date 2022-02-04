import {test, expect} from '@playwright/test'
import {createUniqueDocument, DEFAULT_DATASET, deleteDocument} from '../../helpers'

/* 
  **NOTE**
  In these tests, we are not testing input events, so to speed up the tests we will use use `page.fill()` instead of `page.type()` to populate the document title field 
*/

const DOC_TITLE = 'Document actions [Playwright]'
const inputSelector = 'data-testid=input-title >> input'

// The path of the network request we want to wait for
const documentActionPath = (action) =>
  `*/**/mutate/${DEFAULT_DATASET}?tag=sanity.studio.document.${action}*`

// Helper to generate path to document created in a test
const generateDocumentUri = (docId) =>
  `/${DEFAULT_DATASET}/desk/input-ci;documentActionsCi;${docId}`

// Helper to get the path to the document the client creates for a test
async function getDocumentUri(_type: string, title?: string) {
  const testDoc = await createUniqueDocument({_type, title})
  return [generateDocumentUri(testDoc?._id), testDoc?._id]
}

test.describe('@sanity/desk-tool: document actions', () => {
  // Before we run our tests, delete all previously created test documents to avoid clutter
  test.beforeAll(async () => {
    await deleteDocument({query: `*[_type == "documentActionsCi"]`})
  })

  test('edit and publish document', async ({page}) => {
    const publishButton = page.locator('data-testid=action-Publish')

    await Promise.all([
      getDocumentUri('documentActionsCi').then(([path]) => {
        page.goto(path)
      }),
      page.fill(inputSelector, DOC_TITLE),
    ])

    expect(page.locator(inputSelector)).toHaveValue(DOC_TITLE)
    expect(publishButton).toBeEnabled()
    expect(publishButton).toHaveAttribute('data-disabled', 'false')

    await Promise.all([
      publishButton.click(),
      page.waitForResponse(documentActionPath('publish')),
      expect(publishButton).toBeDisabled(),
      expect(publishButton).toHaveAttribute('data-disabled', 'true'),
    ])
  })

  test('unpublish document', async ({page}) => {
    const publishButton = page.locator('data-testid=action-Publish')

    await getDocumentUri('documentActionsCi', DOC_TITLE).then(([path]) => {
      page.goto(path)
    })

    expect(page.locator(inputSelector)).toHaveValue(DOC_TITLE)
    expect(publishButton).toBeDisabled()
    expect(publishButton).toHaveAttribute('data-disabled', 'true')
    page.locator('data-testid=action-menu-button').click()
    page.locator('data-testid=action-Unpublish').click()

    await Promise.all([
      page.locator('data-testid=confirm-unpublish').click(),
      page.waitForResponse(documentActionPath('unpublish')),
      expect(publishButton).toBeEnabled(),
      expect(publishButton).toHaveAttribute('data-disabled', 'false'),
    ])
  })

  test('duplicate document', async ({page}) => {
    let documentPath

    await getDocumentUri('documentActionsCi', DOC_TITLE).then(([path]) => {
      documentPath = path
      page.goto(path)
    })

    expect(page.locator(inputSelector)).toHaveValue(DOC_TITLE)
    page.locator('data-testid=action-menu-button').click()
    page.locator('data-testid=action-Duplicate').click()

    await Promise.all([
      page.waitForResponse(documentActionPath('duplicate')),
      // Check if we are viewing a new document and not the one created for this test
      expect(page.url()).not.toMatch(`*${documentPath}`),
    ])
  })

  test('delete document', async ({page}) => {
    // Store the document ID so that we can assert that it's been removed from the pane content
    let documentId
    const publishButton = page.locator('data-testid=action-Publish')

    await getDocumentUri('documentActionsCi', DOC_TITLE).then(([path, id]) => {
      documentId = id
      page.goto(path)
    })

    expect(page.locator(inputSelector)).toHaveValue(DOC_TITLE)
    page.locator('data-testid=action-menu-button').click()
    page.locator('data-testid=action-Delete').click()

    await Promise.all([
      page.waitForResponse(documentActionPath('delete')),
      page.locator('data-testid=confirm-delete').click(),
      expect(publishButton).toBeDisabled(),
      expect(publishButton).toHaveAttribute('data-disabled', 'true'),
    ])
    expect(
      await page.locator(`data-testid=pane-content >> data-testid=pane-item-${documentId}`).count()
    ).toBe(0)
  })
})
