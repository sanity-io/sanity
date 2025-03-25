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

    const getDeprecatedBadge = () => page.getByTestId(`deprecated-badge-${type}`)
    const getDeprecatedMessage = () => page.getByTestId(`deprecated-message-${type}`)

    await expect(getDeprecatedBadge()).toBeVisible()
    await expect(getDeprecatedMessage()).toBeVisible()
    await expect(getDeprecatedBadge()).toHaveText('deprecated')
  })
}
