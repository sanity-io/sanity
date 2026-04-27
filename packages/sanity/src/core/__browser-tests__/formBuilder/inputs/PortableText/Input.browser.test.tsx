import {type PortableTextEditor} from '@portabletext/editor'
import {describe, expect, it} from 'vitest'
import {page, userEvent} from 'vitest/browser'
import {render} from 'vitest-browser-react'
import {type EditorChange} from 'sanity'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {InputStory} from './InputStory'

describe('Portable Text Input', () => {
  describe('Activation', () => {
    it('Show call to action on focus', async () => {
      render(<InputStory ptInputProps={{initialActive: false}} />)
      const $portableTextInput = page.getByTestId('field-body')
      const $activeOverlay = $portableTextInput.getByTestId('activate-overlay')

      // Assertion: Show correct text on keyboard focus
      await $activeOverlay.element().focus()
      await expect.element($activeOverlay).toHaveTextContent('Click or press space to activate')
    })

    it('Show call to action on hover', async () => {
      render(<InputStory ptInputProps={{initialActive: false}} />)
      const $portableTextInput = page.getByTestId('field-body')
      const $activeOverlay = $portableTextInput.getByTestId('activate-overlay')

      // Assertion: Show correct text on pointer hover
      await userEvent.hover($activeOverlay)
      await expect.element($activeOverlay).toHaveTextContent('Click to activate')
    })

    it("Immediately activate on mount when 'initialActive' is true", async () => {
      render(<InputStory ptInputProps={{initialActive: true}} />)

      const $portableTextInput = page.getByTestId('field-body')
      const $activeOverlay = $portableTextInput.getByTestId('activate-overlay')
      await expect.element($activeOverlay).not.toBeInTheDocument()
    })

    it("Immediately activate on mount when 'initialActive' is unset", async () => {
      render(<InputStory />)

      const $portableTextInput = page.getByTestId('field-body')
      const $activeOverlay = $portableTextInput.getByTestId('activate-overlay')
      await expect.element($activeOverlay).not.toBeInTheDocument()
    })
  })

  describe('Placeholder', () => {
    it('Displays placeholder text and removes it when typed into', async () => {
      render(<InputStory />)
      const {getFocusedPortableTextEditor, insertPortableText} = testHelpers()
      const $pte = await getFocusedPortableTextEditor('field-body')
      const $placeholder = $pte.getByTestId('pt-input-placeholder')
      // Assertion: placeholder is there
      await expect.element($placeholder).toBeVisible()
      await expect.element($placeholder).toHaveTextContent('Empty')
      // Write some text
      await insertPortableText('Hello there', $pte)
      // Assertion: placeholder was removed
      await expect.element($placeholder).not.toBeVisible()
    })
  })

  describe('Editor Ref', () => {
    it('Editor can be controlled from outside the Input using the editorRef prop', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      let editorIstance: PortableTextEditor | undefined
      render(
        <InputStory
          editorRef={(editor) => {
            if (editor) {
              editorIstance = editor
            }
          }}
        />,
      )
      await getFocusedPortableTextEditor('field-body')
      // If the ref has .schemaTypes.block, it means the editorRef was set correctly
      expect(editorIstance?.schemaTypes.block).toBeDefined()
    })
  })

  describe('onEditorChange', () => {
    it('Supports own handler of editor changes through props', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      const changes: EditorChange[] = []
      const pushChange = (change: EditorChange) => changes.push(change)
      render(<InputStory ptInputProps={{onEditorChange: pushChange}} />)
      await getFocusedPortableTextEditor('field-body')
      expect(changes.length).toBeGreaterThan(0)
    })
  })

  describe('Fullscreen', () => {
    it('Input is rendered as fullscreen', async () => {
      render(<InputStory ptInputProps={{initialFullscreen: true}} />)
      // Assertion: data-fullscreen attribute must be correctly set
      const fullscreenEditor = page.elementLocator(
        document.querySelector('[data-testid="pt-editor"][data-fullscreen="true"]')!,
      )
      await expect.element(fullscreenEditor).toBeVisible()
    })
  })
})
