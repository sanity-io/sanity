import {beforeEach, describe, expect, it} from 'vitest'
import {page} from 'vitest/browser'
import {render} from 'vitest-browser-react'

import {type SanityDocument} from '@sanity/types'

import DisableFocusAndUnsetStory from './DisableFocusAndUnsetStory'

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

describe('Portable Text Input', () => {
  beforeEach(() => {
    window.localStorage.debug = 'sanity-pte:*'
  })
  describe('onPathFocus', () => {
    it(`should not allow setting focus on the input itself`, async () => {
      render(
        <DisableFocusAndUnsetStory
          document={document}
          focusPath={['body', {_key: 'a'}, 'markDefs', {_key: '123'}]}
        />,
      )
      await expect.element(page.getByText('Edit Link')).toBeVisible()
      await page.getByTestId('focusSelfButton').click()
      await page.getByTestId('unsetSelfButton').click()
      await expect.element(page.getByText('Edit Link')).toBeVisible()
    })
  })
})
