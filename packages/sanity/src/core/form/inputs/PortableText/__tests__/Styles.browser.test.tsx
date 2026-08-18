import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {StylesStory} from './StylesStory'

const DEFAULT_STYLE_NAMES = [
  'Normal',
  'Heading 1',
  'Heading 2',
  'Heading 3',
  'Heading 4',
  'Heading 5',
  'Heading 6',
  'Quote',
]

describe('Portable Text Input', () => {
  describe('Styles', () => {
    describe('Toolbar', () => {
      it('Should display all default styles in style selector when clicked', async () => {
        const {getFocusedPortableTextInput} = testHelpers()
        void render(<StylesStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-defaultStyles')
        const $styleSelectButton = $portableTextInput.getByTestId('block-style-select')
        await $styleSelectButton.click()

        const $menu = page.getByRole('menu')
        for (const styleName of DEFAULT_STYLE_NAMES) {
          // The menu items are role="menuitem" buttons whose visible text is the
          // style name, but their accessible name isn't computed from it, so match
          // by visible text within the open menu (mirrors `.filter({hasText})`).
          await expect.element($menu.getByText(styleName, {exact: true})).toBeVisible()
        }
      })

      it('Should not display block style button when no block styles are present', async () => {
        const {getFocusedPortableTextInput} = testHelpers()
        void render(<StylesStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-oneStyle')
        const styleSelectButton = $portableTextInput
          .element()
          .querySelector('button#block-style-select')
        expect(styleSelectButton).toBeNull()
      })
    })
  })
})
