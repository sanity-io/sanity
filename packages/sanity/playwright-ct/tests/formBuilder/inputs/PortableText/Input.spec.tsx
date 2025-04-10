import {expect, test} from '@playwright/experimental-ct-react'
import {type EditorChange, type PortableTextEditor} from '@portabletext/editor'
import {type RefObject} from 'react'

import {testHelpers} from '../../../utils/testHelpers'
import {InputStory} from './InputStory'

test.describe('Portable Text Input', () => {
  test.describe('Activation', () => {
    test(`Show call to action on focus`, async ({mount}) => {
      const component = await mount(<InputStory ptInputProps={{initialActive: false}} />)
      const $portableTextInput = component.getByTestId('field-body')
      const $activeOverlay = $portableTextInput.getByTestId('activate-overlay')

      // Assertion: Show correct text on keyboard focus
      await $activeOverlay.focus()
      await expect($activeOverlay).toHaveText('Click or press space to activate')
    })

    test(`Show call to action on hover`, async ({mount}) => {
      const component = await mount(<InputStory ptInputProps={{initialActive: false}} />)
      const $portableTextInput = component.getByTestId('field-body')
      const $activeOverlay = $portableTextInput.getByTestId('activate-overlay')

      // Assertion: Show correct text on pointer hover
      await $activeOverlay.hover()
      await expect($activeOverlay).toHaveText('Click to activate')
    })

    test(`Immediately activate on mount when 'initialActive' is true`, async ({mount}) => {
      const component = await mount(<InputStory ptInputProps={{initialActive: true}} />)

      const $portableTextInput = component.getByTestId('field-body')
      const $activeOverlay = $portableTextInput.getByTestId('activate-overlay')
      await expect($activeOverlay).not.toBeAttached()
    })

    test(`Immediately activate on mount when 'initialActive' is unset`, async ({mount}) => {
      const component = await mount(<InputStory />)

      const $portableTextInput = component.getByTestId('field-body')
      const $activeOverlay = $portableTextInput.getByTestId('activate-overlay')
      await expect($activeOverlay).not.toBeAttached()
    })
  })

  test.describe('Placeholder', () => {
    test(`Displays placeholder text and removes it when typed into`, async ({mount, page}) => {
      await mount(<InputStory />)
      const {getFocusedPortableTextEditor, insertPortableText} = testHelpers({page})
      const $pte = await getFocusedPortableTextEditor('field-body')
      const $placeholder = $pte.getByTestId('pt-input-placeholder')
      // Assertion: placeholder is there
      await expect($placeholder).toBeVisible()
      await expect($placeholder).toHaveText('Empty')
      // Write some text
      await insertPortableText('Hello there', $pte)
      // Assertion: placeholder was removed
      await expect($placeholder).not.toBeVisible()
    })
  })

  test.describe('Editor Ref', () => {
    test(`Editor can be controlled from outside the Input using the editorRef prop`, async ({
      mount,
      page,
    }) => {
      const {getFocusedPortableTextEditor} = testHelpers({page})
      let ref: undefined | RefObject<PortableTextEditor | null>
      const getRef = (editorRef: RefObject<PortableTextEditor | null>) => {
        ref = editorRef
      }
      await mount(<InputStory getRef={getRef} />)
      await getFocusedPortableTextEditor('field-body')
      // If the ref has .schemaTypes.block, it means the editorRef was set correctly
      expect(ref?.current?.schemaTypes.block).toBeDefined()
    })
  })

  test.describe('onEditorChange', () => {
    test(`Supports own handler of editor changes through props`, async ({mount, page}) => {
      const {getFocusedPortableTextEditor} = testHelpers({page})
      const changes: EditorChange[] = []
      const pushChange = (change: EditorChange) => changes.push(change)
      await mount(<InputStory ptInputProps={{onEditorChange: pushChange}} />)
      await getFocusedPortableTextEditor('field-body')
      expect(changes.length).toBeGreaterThan(0)
    })
  })

  test.describe('Fullscreen', () => {
    test(`Input is rendered as fullscreen`, async ({mount, page}) => {
      await mount(<InputStory ptInputProps={{initialFullscreen: true}} />)
      // Assertion: data-fullscreen attribute must be correctly set
      await expect(page.locator('[data-testid="pt-editor"][data-fullscreen="true"]')).toBeVisible()
    })
  })
})
