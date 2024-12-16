import {expect, test} from '@playwright/experimental-ct-react'
import {type SanityDocument} from 'sanity'

import {testHelpers} from '../../../utils/testHelpers'
import {type DecorationData, RangeDecorationStory} from './RangeDecorationStory'

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
      children: [{_type: 'span', _key: 'a1', text: 'Hello there world'}],
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

// Since we can't pass React components to our story, we'll just pass the selection data,
// and use a test component inside the Story to render the range decoration.
const decorationData: DecorationData[] = [
  {
    word: 'there',
    selection: {
      anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 6},
      focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 11},
    },
  },
]

test.describe('Portable Text Input', () => {
  test.describe('Range Decoration', () => {
    // test.only('Manual testing can be performed with this test', async ({mount, page}) => {
    //   await mount(<RangeDecorationStory document={document} decorationData={decorationData} />)
    //   await page.waitForTimeout(360000)
    // })
    test(`Draws range decoration around our selection`, async ({mount, page}) => {
      const {getFocusedPortableTextEditor} = testHelpers({page})

      await mount(<RangeDecorationStory document={document} decorationData={decorationData} />)

      await getFocusedPortableTextEditor('field-body')

      await expect(page.getByTestId('range-decoration')).toHaveText('there')
    })

    test(`Let's us move the range according to our edits`, async ({mount, page}) => {
      const {getFocusedPortableTextEditor, insertPortableText} = testHelpers({page})

      await mount(<RangeDecorationStory document={document} decorationData={decorationData} />)

      const $pte = await getFocusedPortableTextEditor('field-body')

      await insertPortableText('123 ', $pte)
      await expect($pte).toHaveText("123 Hello there worldIt's a beautiful day on planet earth")
      // Assert that the same word is decorated after the edit
      await expect(page.getByTestId('range-decoration')).toHaveText('there')
      expect(await page.getByTestId('range-decoration').count()).toBe(1)
    })
    test(`Let's us render single point decorations correctly`, async ({mount, page}) => {
      const {getFocusedPortableTextEditor} = testHelpers({page})
      const singlePointDecorationData: DecorationData[] = [
        {
          selection: {
            anchor: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 6},
            focus: {path: [{_key: 'a'}, 'children', {_key: 'a1'}], offset: 6},
          },
          word: '',
        },
      ]
      await mount(
        <RangeDecorationStory document={document} decorationData={singlePointDecorationData} />,
      )
      await getFocusedPortableTextEditor('field-body')
      expect(await page.getByTestId('range-decoration').count()).toBe(1)
    })
  })
})
