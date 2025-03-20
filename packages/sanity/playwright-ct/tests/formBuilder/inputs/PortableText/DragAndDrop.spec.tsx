/* eslint-disable max-nested-callbacks */
import {expect, test} from '@playwright/experimental-ct-react'
import {type Path, type SanityDocument} from '@sanity/types'

import {testHelpers} from '../../../utils/testHelpers'
import DragAndDropStory from './DragAndDropStory'

export type UpdateFn = () => {focusPath: Path; document: SanityDocument}

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
      children: [{_type: 'span', _key: 'b', text: 'Foo'}],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'c',
      children: [{_type: 'span', _key: 'd', text: 'Bar'}],
      markDefs: [],
    },
    {
      _type: 'block',
      _key: 'e',
      children: [{_type: 'span', _key: 'f', text: 'Baz'}],
      markDefs: [],
    },
    {
      _type: 'testObjectBlock',
      _key: 'k',
      text: 'Hello world',
    },
  ],
}

test.describe('Portable Text Input', () => {
  test.beforeEach(async ({page}) => {
    await page.evaluate(() => {
      window.localStorage.debug = 'sanity-pte:*'
    })
  })

  test.describe('Should be able to drag and drop blocks', () => {
    test(`drag and drop blocks`, async ({mount, page}) => {
      await mount(
        <DragAndDropStory
          document={document}
          focusPath={['body', {_key: 'c'}, 'children', {_key: 'd'}, 'text']}
        />,
      )
      const {dragAndDrop, getFocusedPortableTextEditor} = testHelpers({page})

      await getFocusedPortableTextEditor('field-body')

      // Drag and drop the 'Hello world' block to the position of 'Baz'
      await dragAndDrop('.pt-editable [draggable="true"]', '.pt-block.pt-text-block:nth-child(3)')

      await expect(page.locator('.pt-block:nth-child(4)')).toContainText('Baz')
    })

    test(`drag and drop blocks without warning overlay`, async ({mount, page}) => {
      await mount(
        <DragAndDropStory
          document={document}
          focusPath={['body', {_key: 'c'}, 'children', {_key: 'd'}, 'text']}
        />,
      )
      const {dragWithoutDrop, getFocusedPortableTextEditor} = testHelpers({page})

      await getFocusedPortableTextEditor('field-body')

      // Drag and drop the 'Hello world' block to the position of 'Baz' without dropping it
      await dragWithoutDrop(
        '.pt-editable [draggable="true"]',
        '.pt-block.pt-text-block:nth-child(3)',
      )

      await expect(page.getByText(`Can't upload this file here`)).not.toBeVisible()
    })
  })
})
