import {type PortableTextEditor} from '@portabletext/editor'
import {defineArrayMember, defineField, defineType} from '@sanity/types'
import {useMemo} from 'react'
import {type EditorChange, type InputProps, type PortableTextInputProps} from 'sanity'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

interface InputHarnessProps {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  editorRef?: React.Ref<PortableTextEditor | null>
  ptInputProps?: Partial<PortableTextInputProps>
}

function InputHarness(props: InputHarnessProps) {
  const {editorRef, ptInputProps} = props

  const schemaTypes = useMemo(
    () => [
      defineType({
        type: 'document',
        name: 'test',
        title: 'Test',
        fields: [
          defineField({
            type: 'array',
            name: 'body',
            of: [
              defineArrayMember({
                type: 'block',
              }),
            ],
            components: {
              input: (inputProps: InputProps) => {
                const editorProps = {
                  ...inputProps,
                  ...ptInputProps,
                  editorRef,
                } as PortableTextInputProps
                return (
                  <div data-testid="pt-input-with-editor-ref">
                    {inputProps.renderDefault(editorProps)}
                  </div>
                )
              },
            },
          }),
        ],
      }),
    ],
    [ptInputProps, editorRef],
  )

  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm />
    </TestWrapper>
  )
}

describe('Portable Text Input', () => {
  describe('Activation', () => {
    it('Show call to action on focus', async () => {
      void render(<InputHarness ptInputProps={{initialActive: false}} />)
      const $portableTextInput = page.getByTestId('field-body')
      const $activeOverlay = $portableTextInput.getByTestId('activate-overlay')

      // Wait for the overlay to mount before reaching for the raw element
      await expect.element($activeOverlay).toBeVisible()

      // Assertion: Show correct text on keyboard focus
      await $activeOverlay.element().focus()
      await expect.element($activeOverlay).toHaveTextContent('Click or press space to activate')
    })

    it('Show call to action on hover', async () => {
      void render(<InputHarness ptInputProps={{initialActive: false}} />)
      const $portableTextInput = page.getByTestId('field-body')
      const $activeOverlay = $portableTextInput.getByTestId('activate-overlay')

      // Assertion: Show correct text on pointer hover
      await userEvent.hover($activeOverlay)
      await expect.element($activeOverlay).toHaveTextContent('Click to activate')
    })

    it("Immediately activate on mount when 'initialActive' is true", async () => {
      void render(<InputHarness ptInputProps={{initialActive: true}} />)

      const $portableTextInput = page.getByTestId('field-body')
      const $activeOverlay = $portableTextInput.getByTestId('activate-overlay')
      await expect.element($activeOverlay).not.toBeInTheDocument()
    })

    it("Immediately activate on mount when 'initialActive' is unset", async () => {
      void render(<InputHarness />)

      const $portableTextInput = page.getByTestId('field-body')
      const $activeOverlay = $portableTextInput.getByTestId('activate-overlay')
      await expect.element($activeOverlay).not.toBeInTheDocument()
    })
  })

  describe('Placeholder', () => {
    it('Displays placeholder text and removes it when typed into', async () => {
      void render(<InputHarness />)
      const {getFocusedPortableTextEditor, insertPortableText} = testHelpers()
      const $pte = await getFocusedPortableTextEditor('field-body')
      // Scope to the field rather than the textbox locator: the placeholder
      // lives inside the contenteditable, where the role-based locator doesn't
      // resolve reliably in vitest-browser.
      const $placeholder = page.getByTestId('field-body').getByTestId('pt-input-placeholder')
      // Assertion: placeholder is there
      await expect.element($placeholder).toBeVisible()
      await expect.element($placeholder).toHaveTextContent('Empty')
      // Write some text
      await insertPortableText('Hello there', $pte)
      // Assertion: placeholder was removed
      await expect.element($placeholder).not.toBeInTheDocument()
    })
  })

  describe('Editor Ref', () => {
    it('Editor can be controlled from outside the Input using the editorRef prop', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      let editorIstance: PortableTextEditor | undefined
      void render(
        <InputHarness
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
      void render(<InputHarness ptInputProps={{onEditorChange: pushChange}} />)
      await getFocusedPortableTextEditor('field-body')
      expect(changes.length).toBeGreaterThan(0)
    })
  })

  describe('Fullscreen', () => {
    it('Input is rendered as fullscreen', async () => {
      void render(<InputHarness ptInputProps={{initialFullscreen: true}} />)
      // Assertion: data-fullscreen attribute must be correctly set. Use a
      // retrying locator + attribute matcher instead of an eager querySelector
      // (which returns null before the editor mounts and throws).
      const $editor = page.getByTestId('pt-editor')
      await expect.element($editor).toBeVisible()
      await expect.element($editor).toHaveAttribute('data-fullscreen', 'true')
    })
  })
})
