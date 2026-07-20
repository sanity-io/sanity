import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import NestedInputStory from './NestedInputStory'

const {render} = await import('vitest-browser-react')

describe('Portable Text Input', () => {
  describe('Nested inputs', () => {
    it('Writing new lines in a nested input, will not cause issues with the DOM selection', async () => {
      const {
        getFocusedPortableTextInput,
        insertPortableText,
        waitForFocusedNodeText,
        waitForSelectionOffsets,
      } = testHelpers()
      void render(<NestedInputStory />)

      const $portableTextInput = await getFocusedPortableTextInput('field-body')

      await page.getByRole('button', {name: 'Insert Inline Object'}).click()

      // Wait for the edit dialog to appear
      const $dialog = page.getByTestId('popover-edit-dialog')
      await expect.element($dialog).toBeVisible()

      // Assertion: Object preview should be visible in the main editor
      const inlineObject = $portableTextInput.element().querySelector('[data-pt-inline="object"]')
      expect(inlineObject).toBeTruthy()

      // Find the nested portable text input within the dialog
      const $inlinePopover = $dialog.getByTestId('inlinePopover')
      await expect.element($inlinePopover).toBeVisible()

      // Get the nested textbox (caption field)
      const textboxElements = $inlinePopover.getByRole('textbox').elements()
      const lastTextbox = textboxElements[textboxElements.length - 1]
      expect(lastTextbox).toBeTruthy()

      const $nestedPTE = page.elementLocator(lastTextbox!)
      await expect.element($nestedPTE).toBeVisible()
      lastTextbox!.focus()

      await insertPortableText('1', $nestedPTE)
      await userEvent.keyboard('{Enter}')
      await insertPortableText('2', $nestedPTE)
      await userEvent.keyboard('{Enter}')
      await insertPortableText('3', $nestedPTE)

      await waitForFocusedNodeText('3')
      // Assert that it did receive the correct offsets
      await waitForSelectionOffsets({focus: 1, anchor: 1})

      // Assert that the selection isn't reset to the start of the line
      // See https://github.com/sanity-io/sanity/pull/5136
      await new Promise((r) => setTimeout(r, 1000)) // Wait for new props.value to be returned

      let failed = false
      try {
        await waitForSelectionOffsets({focus: 0, anchor: 0}, 100)
      } catch {
        // We expect this to throw with the timeout error
        failed = true
      }
      expect(failed).toBeTruthy()
    })

    it('opens one editable annotation dialog in an independently nested input', async () => {
      const document: SanityDocument = {
        _id: 'nested-input',
        _type: 'test',
        _createdAt: '2026-01-01T00:00:00Z',
        _updatedAt: '2026-01-01T00:00:00Z',
        _rev: 'nested-input',
        body: [
          {
            _key: 'objectBlock',
            _type: 'nestedObjectBlock',
            siteOverrides: [
              {
                _key: 'siteOverride',
                _type: 'siteOverride',
                content: [
                  {
                    _key: 'nestedBlock',
                    _type: 'block',
                    children: [
                      {
                        _key: 'nestedSpan',
                        _type: 'span',
                        marks: ['nestedAnnotation'],
                        text: 'nested link',
                      },
                    ],
                    markDefs: [
                      {
                        _key: 'nestedAnnotation',
                        _type: 'nestedAnnotation',
                        value: '',
                      },
                    ],
                    style: 'normal',
                  },
                ],
              },
            ],
          },
        ],
      }
      void render(
        <NestedInputStory
          document={document}
          focusPath={[
            'body',
            {_key: 'objectBlock'},
            'siteOverrides',
            {_key: 'siteOverride'},
            'content',
            {_key: 'nestedBlock'},
            'markDefs',
            {_key: 'nestedAnnotation'},
            'value',
          ]}
        />,
      )

      const annotationDialogs = () =>
        page
          .getByTestId('popover-edit-dialog')
          .elements()
          .filter((element) => element.textContent?.includes('Edit Nested annotation'))
      await expect.poll(() => annotationDialogs().length).toBe(1)

      const $annotationInput = page.getByLabelText('Annotation value')
      await expect.element($annotationInput).toBeVisible()
      await $annotationInput.click()
      await expect.element($annotationInput).toHaveFocus()

      await userEvent.keyboard('abc')
      await expect.element($annotationInput).toHaveValue('abc')
      await userEvent.keyboard('{ArrowLeft}{Shift>}{ArrowLeft}{/Shift}')

      const annotationInput = $annotationInput.element() as HTMLInputElement
      expect(annotationInput.selectionStart).toBe(1)
      expect(annotationInput.selectionEnd).toBe(2)
    })
  })
})
