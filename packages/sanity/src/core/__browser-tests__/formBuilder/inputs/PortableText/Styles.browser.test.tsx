import {describe, expect, it} from 'vitest'
import {page} from 'vitest/browser'
import {render} from 'vitest-browser-react'

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
        render(<StylesStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-defaultStyles')
        const $styleSelectButton = page.elementLocator(
          $portableTextInput.element().querySelector('button#block-style-select')!,
        )
        await $styleSelectButton.click()

        for (const styleName of DEFAULT_STYLE_NAMES) {
          await expect
            .element(page.getByRole('menuitem', {name: styleName}))
            .toBeVisible()
        }
      })

      it('Should not display block style button when no block styles are present', async () => {
        const {getFocusedPortableTextInput} = testHelpers()
        render(<StylesStory />)
        const $portableTextInput = await getFocusedPortableTextInput('field-oneStyle')
        const styleSelectButton = $portableTextInput
          .element()
          .querySelector('button#block-style-select')
        expect(styleSelectButton).toBeNull()
      })
    })
  })
})
