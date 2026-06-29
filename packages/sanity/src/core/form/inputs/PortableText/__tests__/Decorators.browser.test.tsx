import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {DecoratorsStory} from './DecoratorsStory'

const DEFAULT_DECORATORS = [
  {
    name: 'strong',
    title: 'Strong',
    hotkey: 'b',
    icon: 'bold',
  },
  {
    name: 'em',
    title: 'Italic',
    hotkey: 'i',
    icon: 'italic',
  },
  {
    name: 'underline',
    title: 'Underline',
    hotkey: 'u',
    icon: 'underline',
  },
  {
    name: 'code',
    title: 'Code',
    hotkey: "'",
    icon: 'code',
  },
  {
    name: 'strike-through',
    title: 'Strike',
    hotkey: undefined, // Currently not defined
    icon: 'strikethrough',
  },
]

describe('Portable Text Input', () => {
  describe('Decorators', () => {
    it('Render default decorators with keyboard shortcuts', async () => {
      const {
        findBySelector,
        getModifierKey,
        getFocusedPortableTextEditor,
        getFocusedPortableTextInput,
        insertPortableText,
        toggleHotkey,
      } = testHelpers()
      void render(<DecoratorsStory />)
      const $portableTextInput = await getFocusedPortableTextInput('field-defaultDecorators')
      const $pte = await getFocusedPortableTextEditor('field-defaultDecorators')
      const modifierKey = getModifierKey()

      for (const decorator of DEFAULT_DECORATORS) {
        if (decorator.hotkey) {
          // Turn on the decorator
          await toggleHotkey(decorator.hotkey, modifierKey)
          // Assertion: button was toggled
          const $selectedButton = await findBySelector(
            $portableTextInput,
            `button[data-testid="action-button-${decorator.name}"][data-selected]:not([disabled])`,
          )
          await expect.element($selectedButton).toBeVisible()
          // Insert some text
          await insertPortableText(`${decorator.name} text 123`, $pte)
          // Turn off the decorator
          await toggleHotkey(decorator.hotkey, modifierKey)
          // Assertion: button was toggled
          const $unselectedButton = await findBySelector(
            $portableTextInput,
            `button[data-testid="action-button-${decorator.name}"]:not([data-selected]):not([disabled])`,
          )
          await expect.element($unselectedButton).toBeVisible()
          // Assertion: text has the correct decorator value
          const $decoratedText = await findBySelector($pte, `[data-mark="${decorator.name}"]`)
          await expect.element($decoratedText).toBeVisible()
          await expect.element($decoratedText).toHaveTextContent(`${decorator.name} text 123`)
        }
      }
    })

    it('applying a decorator writes `marks` to the document value', async () => {
      const {
        getFocusedPortableTextEditor,
        getModifierKey,
        insertPortableText,
        toggleHotkey,
        waitForDocumentState,
      } = testHelpers()
      void render(<DecoratorsStory />)
      const $pte = await getFocusedPortableTextEditor('field-defaultDecorators')
      const modifierKey = getModifierKey()

      await toggleHotkey('b', modifierKey)
      await insertPortableText('bold text', $pte)

      // Assertion: the span carries the decorator mark
      const documentState = await waitForDocumentState((state) => {
        const span = state?.defaultDecorators?.[0]?.children?.[0]
        return span?.text === 'bold text' && span?.marks?.includes('strong')
      })
      expect(documentState.defaultDecorators[0].children[0].marks).toEqual(['strong'])
    })

    describe('Toolbar buttons', () => {
      it('Should display all default decorator buttons', async () => {
        const {getFocusedPortableTextInput} = testHelpers()
        void render(<DecoratorsStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-defaultDecorators')

        // Assertion: All buttons in the menu bar should be visible and have icon
        for (const decorator of DEFAULT_DECORATORS) {
          const $button = $portableTextInput.getByRole('button', {name: decorator.title})
          await expect.element($button).toBeVisible()
          const $icon = page.elementLocator(
            $button.element().querySelector(`svg[data-sanity-icon='${decorator.icon}']`)!,
          )
          await expect.element($icon).toBeVisible()
        }
      })

      it('Should display custom decorator button and icon', async () => {
        const {getFocusedPortableTextInput} = testHelpers()
        void render(<DecoratorsStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-customDecorator')
        // Assertion: Button for highlight should exist
        const $highlightButton = $portableTextInput.getByRole('button', {name: 'Highlight'})
        await expect.element($highlightButton).toBeVisible()
        // Assertion: Icon for highlight should exist
        const $icon = page.elementLocator(
          $highlightButton.element().querySelector(`svg[data-sanity-icon='bulb-outline']`)!,
        )
        await expect.element($icon).toBeVisible()
      })
    })
  })
})
