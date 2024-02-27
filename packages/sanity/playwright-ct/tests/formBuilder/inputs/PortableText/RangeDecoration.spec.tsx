import {expect, test} from '@playwright/experimental-ct-react'
import {type RangeDecoration} from '@sanity/portable-text-editor'
import {type SanityDocument} from 'sanity'

import {RangeDecorationStory} from './RangeDecorationStory'

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  body: [
    {
      _type: 'block',
      _key: 'a',
      children: [{_type: 'span', _key: 'a1', text: 'Hello world'}],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'b',
      children: [{_type: 'span', _key: 'b1', text: "It's a beautiful day on planet earth"}],
      markDefs: [],
    },
  ],
}

test.skip('Portable Text Input', () => {
  test.describe('Range Decoration', () => {
    test(`Draws range decoration around content`, async ({mount, page}) => {
      const rangeDecorations: RangeDecoration[] = [
        {
          component: ({children}) => (
            <span style={{backgroundColor: 'red'}} data-testid="range-decoration">
              {children}
            </span>
          ),
          selection: {
            anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 6},
            focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 11},
          },
        },
      ]
      await mount(<RangeDecorationStory document={document} rangeDecorations={rangeDecorations} />)
      await expect(page.getByTestId('range-decorator')).toBeVisible()
    })
  })
})
