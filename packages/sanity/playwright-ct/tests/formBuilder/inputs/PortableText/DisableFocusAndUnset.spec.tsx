import {expect, test} from '@playwright/experimental-ct-react'
import {type Path, type SanityDocument} from '@sanity/types'

import DisableFocusAndUnsetStory from './DisableFocusAndUnsetStory'

export type UpdateFn = () => {focusPath: Path; document: SanityDocument}

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  body: [
    {
      _key: 'a',
      _type: 'block',
      children: [{_key: 'b', _type: 'span', text: 'Foo', marks: ['123']}],
      markDefs: [
        {
          _key: '123',
          _type: 'link',
          href: 'http://example.com',
        },
      ],
    },
  ],
}

test.describe('Portable Text Input', () => {
  test.beforeEach(async ({page}) => {
    await page.evaluate(() => {
      window.localStorage.debug = 'sanity-pte:*'
    })
  })
  test.describe('onPathFocus', () => {
    test(`should not allow setting focus on the input itself`, async ({mount, page}) => {
      await mount(
        <DisableFocusAndUnsetStory
          document={document}
          focusPath={['body', {_key: 'a'}, 'markDefs', {_key: '123'}]}
        />,
      )
      await expect(page.getByText('Edit Link')).toBeVisible()
      await page.getByTestId('focusSelfButton').click()
      await page.getByTestId('unsetSelfButton').click()
      await expect(page.getByText('Edit Link')).toBeVisible()
    })
  })
})
