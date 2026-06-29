import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {CustomBlockComponentsStory} from './CustomBlockComponentsStory'
import {StylesStory} from './StylesStory'

describe('Portable Text Input', () => {
  describe('Lists', () => {
    it('toggling a list writes `listItem`/`level` and emits the counter attributes', async () => {
      const {
        getFocusedPortableTextInput,
        getFocusedPortableTextEditor,
        insertPortableText,
        findBySelector,
        waitForDocumentState,
      } = testHelpers()
      void render(<StylesStory />)

      const $portableTextInput = await getFocusedPortableTextInput('field-defaultStyles')
      const $pte = await getFocusedPortableTextEditor('field-defaultStyles')
      await insertPortableText('List item text', $pte)

      const $numberButton = await findBySelector(
        $portableTextInput,
        'button[data-testid="action-button-number"]:not([disabled])',
      )
      await $numberButton.click()

      const documentState = await waitForDocumentState(
        (state) => state?.defaultStyles?.[0]?.listItem === 'number',
      )
      expect(documentState.defaultStyles[0].listItem).toEqual('number')
      expect(documentState.defaultStyles[0].level).toEqual(1)

      // The ordered-list counter CSS keys off these editor-emitted attributes.
      const $listBlock = await findBySelector($pte, '[data-pt-block="text"][data-level]')
      expect($listBlock.element().getAttribute('data-level')).toEqual('1')
      expect($listBlock.element().hasAttribute('data-list-index')).toBe(true)
    })

    it('renders a consumer-provided list component', async () => {
      const {
        getFocusedPortableTextInput,
        getFocusedPortableTextEditor,
        insertPortableText,
        findBySelector,
      } = testHelpers()
      void render(<CustomBlockComponentsStory />)
      const $portableTextInput = await getFocusedPortableTextInput('field-customComponents')
      const $pte = await getFocusedPortableTextEditor('field-customComponents')
      await insertPortableText('List text', $pte)

      const $listButton = await findBySelector(
        $portableTextInput,
        'button[data-testid="action-button-customList"]:not([disabled])',
      )
      await $listButton.click()

      // Assertion: the consumer's list component is invoked through the render
      // path (it wraps `renderDefault`, so this also proves it was passed in)
      await expect.element(page.getByTestId('custom-list-component')).toBeVisible()
    })
  })
})
