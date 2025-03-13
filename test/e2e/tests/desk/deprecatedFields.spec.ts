import {expect} from '@playwright/test'
import {test} from '@sanity/test'

const allTypes = [
  'string',
  'number',
  'boolean',
  'email',
  'array',
  'object',
  'reference',
  'crossDatasetReference',
  'image',
  'file',
  'date',
  'datetime',
  'url',
  'slug',
  'text',
  'geopoint',
  'namedDeprecatedObject',
  'namedDeprecatedArray',
]
test.describe('deprecated field indicators', () => {
  // Use a single document across all tests
  let documentCreated = false

  test.beforeEach(async ({createDraftDocument}) => {
    // Only create the document for the first test
    if (!documentCreated) {
      await createDraftDocument('/test/content/input-debug;deprecatedFields')
      documentCreated = true
    }
  })

  for (const type of allTypes) {
    test(`${type} type shows deprecated message`, async ({page}) => {
      // await createDraftDocument('/test/content/input-debug;deprecatedFields')
      // wait for the next assertion to be created
      await page.waitForSelector(`[data-testid="deprecated-badge-${type}"]`)
      await expect(page.getByTestId(`deprecated-badge-${type}`)).toBeVisible()

      const deprecatedBadge = page.getByTestId(`deprecated-badge-${type}`)
      const deprecatedMessage = page.getByTestId(`deprecated-message-${type}`)

      await expect(deprecatedMessage).toBeVisible()
      await expect(deprecatedBadge).toHaveText('deprecated')
    })
  }
})
