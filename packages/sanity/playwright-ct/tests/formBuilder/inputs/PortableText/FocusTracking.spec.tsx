/* eslint-disable max-nested-callbacks */
import {expect, test} from '@playwright/experimental-ct-react'
import React from 'react'
import {Path, SanityDocument} from '@sanity/types'
import {Page} from '@playwright/test'
import FocusTrackingStory from './FocusTrackingStory'

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

test.describe('Portable Text Input', () => {
  test.beforeEach(async ({page}) => {
    await page.evaluate(() => {
      window.localStorage.debug = 'sanity-pte:*'
    })
  })
  test.describe('Should track focusPath', () => {
    test(`for span .text`, async ({mount, page}) => {
      const component = await mount(
        <FocusTrackingStory
          document={document}
          focusPath={['body', {_key: 'c'}, 'children', {_key: 'd'}, 'text']}
        />,
      )
      const $portableTextInput = component.getByTestId('field-body')
      const $pteTextbox = $portableTextInput.getByRole('textbox')
      await expect($pteTextbox).toBeFocused()
      expect(await getFocusedNodeText(page)).toEqual('Bar')
      await setFocusPathFromOutside(page, ['body', {_key: 'e'}, 'children', {_key: 'f'}, 'text'])
      expect(await getFocusedNodeText(page)).toEqual('Baz')
    })
    test(`for span child root`, async ({mount, page}) => {
      const component = await mount(
        <FocusTrackingStory
          document={document}
          focusPath={['body', {_key: 'c'}, 'children', {_key: 'd'}]}
        />,
      )
      const $portableTextInput = component.getByTestId('field-body')
      const $pteTextbox = $portableTextInput.getByRole('textbox')
      await expect($pteTextbox).toBeFocused()
      expect(await getFocusedNodeText(page)).toEqual('Bar')
      await setFocusPathFromOutside(page, ['body', {_key: 'e'}, 'children', {_key: 'f'}])
      expect(await getFocusedNodeText(page)).toEqual('Baz')
    })
    test(`for inline objects with .text prop`, async ({mount, page}) => {
      const component = await mount(
        <FocusTrackingStory
          document={document}
          focusPath={['body', {_key: 'g'}, 'children', {_key: 'i'}, 'text']}
        />,
      )
      const $portableTextInput = component.getByTestId('field-body')
      const $pteTextbox = $portableTextInput.getByRole('textbox')
      await expect($pteTextbox).not.toBeFocused()
      const inlineObjectTextInput = page.getByTestId('inlineTextInputField').getByRole('textbox')
      await expect(inlineObjectTextInput).toBeFocused()
      await setFocusPathFromOutside(page, ['body', {_key: 'e'}, 'children', {_key: 'f'}])
      await expect($pteTextbox).toBeFocused()
    })
    test(`for object blocks with .text prop`, async ({mount, page}) => {
      const component = await mount(
        <FocusTrackingStory document={document} focusPath={['body', {_key: 'k'}, 'text']} />,
      )
      const $portableTextInput = component.getByTestId('field-body')
      const $pteTextbox = $portableTextInput.getByRole('textbox')
      await expect($pteTextbox).not.toBeFocused()
      const blockObjectInput = page.getByTestId('objectBlockInputField').getByRole('textbox')
      await expect(blockObjectInput).toBeFocused()
    })
    test(`for block paths`, async ({mount, page}) => {
      const component = await mount(
        <FocusTrackingStory document={document} focusPath={['body', {_key: 'k'}]} />,
      )
      const $portableTextInput = component.getByTestId('field-body')
      const $pteTextbox = $portableTextInput.getByRole('textbox')
      await expect($pteTextbox).not.toBeFocused()
      const blockObjectInput = page.getByTestId('objectBlockInputField').getByRole('textbox')
      await expect(blockObjectInput).toBeVisible()
      await setFocusPathFromOutside(page, ['body', {_key: 'g'}])
      await expect($pteTextbox).toBeFocused()
      await expect(blockObjectInput).not.toBeVisible()
    })
  })
})

async function setFocusPathFromOutside(page: Page, path: Path) {
  await page.evaluate(
    ({_path}) => {
      ;(window as any).__setFocusPath(_path)
    },
    {_path: path},
  )
  await page.waitForSelector(`[data-focus-path='${JSON.stringify(path)}']`)
}

function getFocusedNodeText(page: Page) {
  return page.evaluate(() => window.getSelection()?.focusNode?.textContent)
}
