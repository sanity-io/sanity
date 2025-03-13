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

for (const type of allTypes) {
  test(`${type} type shows deprecated message`, async ({page, createDraftDocument}) => {
    await createDraftDocument('/test/content/input-debug;deprecatedFields')

    await expect(await page.getByTestId(`deprecated-badge-${type}`)).toBeVisible()

    const deprecatedBadge = page.getByTestId(`deprecated-badge-${type}`)
    const deprecatedMessage = page.getByTestId(`deprecated-message-${type}`)

    await expect(deprecatedMessage).toBeVisible()
    await expect(deprecatedBadge).toHaveText('deprecated')
  })
}
