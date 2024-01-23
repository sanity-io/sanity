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

    await page.waitForSelector(`data-testid=deprecated-badge-${type}`)

    const deprecatedBadge = await page.getByTestId(`deprecated-badge-${type}`)
    const deprecatedMessage = await page.getByTestId(`deprecated-message-${type}`)

    expect(deprecatedBadge).toHaveText('deprecated')
    expect(deprecatedMessage).toBeVisible()
  })
}
