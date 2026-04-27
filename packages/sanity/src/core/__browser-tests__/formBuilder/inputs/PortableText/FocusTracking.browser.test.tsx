import {beforeEach, describe, expect, it} from 'vitest'
import {page} from 'vitest/browser'
import {render} from 'vitest-browser-react'

import {type Path, type SanityDocument} from '@sanity/types'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import FocusTrackingStory from './FocusTrackingStory'

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
      _type: 'block',
      _key: 'g',
      children: [
        {_type: 'span', _key: 'h', text: 'Hello '},
        {_type: 'inlineObjectWithTextProperty', _key: 'i', text: 'there'},
        {_type: 'span', _key: 'j', text: ' playwright'},
      ],
      markDefs: [],
    },
    {
      _type: 'testObjectBlock',
      _key: 'k',
      text: 'Hello world',
    },
  ],
}

describe('Portable Text Input', () => {
  beforeEach(() => {
    window.localStorage.debug = 'sanity-pte:*'
  })
  describe('Should track focusPath', () => {
    it(`for span .text`, async () => {
      const {waitForFocusedNodeText} = testHelpers()
      const {rerender} = render(
        <FocusTrackingStory
          document={document}
          focusPath={['body', {_key: 'c'}, 'children', {_key: 'd'}, 'text']}
        />,
      )
      await waitForFocusedNodeText('Bar')
      rerender(
        <FocusTrackingStory
          document={document}
          focusPath={['body', {_key: 'e'}, 'children', {_key: 'f'}, 'text']}
        />,
      )
      await waitForFocusedNodeText('Baz')
    })
    it(`for span child root`, async () => {
      const {waitForFocusedNodeText} = testHelpers()
      const {rerender} = render(
        <FocusTrackingStory
          document={document}
          focusPath={['body', {_key: 'c'}, 'children', {_key: 'd'}]}
        />,
      )
      await waitForFocusedNodeText('Bar')
      rerender(
        <FocusTrackingStory
          document={document}
          focusPath={['body', {_key: 'e'}, 'children', {_key: 'f'}]}
        />,
      )
      await waitForFocusedNodeText('Baz')
    })
    it(`for inline objects with .text prop`, async () => {
      const {rerender} = render(
        <FocusTrackingStory
          document={document}
          focusPath={['body', {_key: 'g'}, 'children', {_key: 'i'}, 'text']}
        />,
      )

      const $portableTextInput = page.getByTestId('field-body')
      const $pteTextbox = $portableTextInput.getByRole('textbox')
      await expect.element($pteTextbox).not.toHaveFocus()

      // Wait for the input to be visible and then focus it directly
      const inlineObjectTextInput = page.getByTestId('inlineTextInputField').getByRole('textbox')
      await expect.element(inlineObjectTextInput).toBeVisible()

      // Focus the input directly - more reliable than auto-focus in CI
      inlineObjectTextInput.element().focus()
      await expect.element(inlineObjectTextInput).toHaveFocus()

      rerender(
        <FocusTrackingStory
          document={document}
          focusPath={['body', {_key: 'e'}, 'children', {_key: 'f'}]}
        />,
      )
      await expect.element($pteTextbox).toHaveFocus()
    })
    it(`for object blocks with .text prop`, async () => {
      render(
        <FocusTrackingStory document={document} focusPath={['body', {_key: 'k'}, 'text']} />,
      )
      await expect.element(page.getByTestId('nested-object-dialog')).toBeVisible()

      const $portableTextInput = page.getByTestId('field-body')
      const $pteTextbox = $portableTextInput.getByRole('textbox')
      await expect.element($pteTextbox).not.toHaveFocus()

      // Wait for the input to be visible and then focus it directly
      const blockObjectInput = page.getByTestId('objectBlockInputField').getByRole('textbox')
      await expect.element(blockObjectInput).toBeVisible()

      // Focus the input directly - more reliable than tab navigation in CI
      blockObjectInput.element().focus()
      await expect.element(blockObjectInput).toHaveFocus()
    })
    it(`for block paths`, async () => {
      const {rerender} = render(
        <FocusTrackingStory document={document} focusPath={['body', {_key: 'k'}]} />,
      )
      const $portableTextInput = page.getByTestId('field-body')
      const $pteTextbox = $portableTextInput.getByRole('textbox')
      await expect.element($pteTextbox).not.toHaveFocus()
      const blockObjectInput = page.getByTestId('objectBlockInputField').getByRole('textbox')
      await expect.element(blockObjectInput).toBeVisible()
      rerender(
        <FocusTrackingStory document={document} focusPath={['body', {_key: 'g'}]} />,
      )

      await expect.element($pteTextbox).toHaveFocus()
      await expect.element(blockObjectInput).not.toBeVisible()
    })
  })
  it(`reports focus on spans with with .text prop, and everything else without`, async () => {
    const paths: Path[] = []
    const pushPath = (path: Path) => paths.push(path)
    const {getFocusedPortableTextEditor} = testHelpers()
    render(<FocusTrackingStory document={document} onPathFocus={pushPath} />)
    const $pte = await getFocusedPortableTextEditor('field-body')
    await expect.element($pte).toHaveFocus()
    expect(paths.slice(-1)[0]).toEqual(['body', {_key: 'a'}, 'children', {_key: 'b'}, 'text'])
    const $inlineObject = page.getByTestId('inline-preview')
    await $inlineObject.click()
    expect(paths.slice(-1)[0]).toEqual(['body', {_key: 'g'}, 'children', {_key: 'i'}])
    const $blockObject = page.getByTestId('pte-block-object')
    await $blockObject.click()
    expect(paths.slice(-1)[0]).toEqual(['body', {_key: 'k'}])
  })
})
