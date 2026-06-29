import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {CustomBlockComponentsStory} from './CustomBlockComponentsStory'
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

    it('applying a block style writes `style` to the document value', async () => {
      const {
        getFocusedPortableTextInput,
        getFocusedPortableTextEditor,
        insertPortableText,
        waitForDocumentState,
      } = testHelpers()
      void render(<StylesStory />)
      const $portableTextInput = await getFocusedPortableTextInput('field-defaultStyles')
      const $pte = await getFocusedPortableTextEditor('field-defaultStyles')
      await insertPortableText('Heading text', $pte)

      await $portableTextInput.getByTestId('block-style-select').click()
      await page.getByRole('menu').getByText('Heading 1', {exact: true}).click()

      // Assertion: the block carries the selected style
      const documentState = await waitForDocumentState(
        (state) => state?.defaultStyles?.[0]?.style === 'h1',
      )
      expect(documentState.defaultStyles[0].style).toEqual('h1')
    })

    it('renders a consumer-provided style component', async () => {
      const {getFocusedPortableTextEditor} = testHelpers()
      void render(
        <CustomBlockComponentsStory
          document={{
            _id: '123',
            _type: 'test',
            _createdAt: new Date().toISOString(),
            _updatedAt: new Date().toISOString(),
            _rev: '123',
            customComponents: [
              {
                _key: 'b1',
                _type: 'block',
                style: 'custom',
                children: [{_key: 's1', _type: 'span', text: 'Styled text', marks: []}],
                markDefs: [],
              },
            ],
          }}
        />,
      )
      await getFocusedPortableTextEditor('field-customComponents')

      // Assertion: the consumer's style component is invoked through the render
      // path (it wraps `renderDefault`, so this also proves it was passed in)
      await expect.element(page.getByTestId('custom-style-component')).toBeVisible()
    })
  })
})
