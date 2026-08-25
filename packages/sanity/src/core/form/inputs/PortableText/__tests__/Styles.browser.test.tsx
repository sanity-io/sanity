import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

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

      it('Applies the chosen style to every block in the selection, not just the focus block', async () => {
        const documentValue: SanityDocument = {
          _id: '123',
          _type: 'test',
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
          _rev: '123',
          defaultStyles: [
            {
              _type: 'block',
              _key: 'b0',
              style: 'h2',
              markDefs: [],
              children: [{_type: 'span', _key: 's0', text: 'Heading text', marks: []}],
            },
            {
              _type: 'block',
              _key: 'b1',
              style: 'normal',
              markDefs: [],
              children: [{_type: 'span', _key: 's1', text: 'Normal text', marks: []}],
            },
          ],
        }

        const {getFocusedPortableTextInput, waitForFocusedNodeText, waitForDocumentState} =
          testHelpers()
        void render(<StylesStory document={documentValue} />)
        const $portableTextInput = await getFocusedPortableTextInput('field-defaultStyles')

        const $headingText = [...$portableTextInput.element().querySelectorAll('*')].find(
          (node) => node.childElementCount === 0 && node.textContent === 'Heading text',
        )
        await userEvent.click($headingText as HTMLElement)
        // Place the selection anchor at the end of the `h2` block, then extend
        // the focus down into the `normal` block below it, so the selection
        // spans both blocks with its focus outside the `h2` block.
        await userEvent.keyboard('{End}')
        await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
        await waitForFocusedNodeText('Normal text')

        const $styleSelectButton = $portableTextInput.getByTestId('block-style-select')
        await $styleSelectButton.click()
        const $menu = page.getByRole('menu')
        await $menu.getByText('Normal', {exact: true}).click()

        const documentState = await waitForDocumentState(
          (state) => state?.defaultStyles?.[0]?.style === 'normal',
        )
        expect(documentState.defaultStyles).toEqual([
          {
            _type: 'block',
            _key: 'b0',
            style: 'normal',
            markDefs: [],
            children: [{_type: 'span', _key: 's0', text: 'Heading text', marks: []}],
          },
          {
            _type: 'block',
            _key: 'b1',
            style: 'normal',
            markDefs: [],
            children: [{_type: 'span', _key: 's1', text: 'Normal text', marks: []}],
          },
        ])
      })

      it('Leaves a style-less block alone when it already resolves to the chosen style', async () => {
        const documentValue: SanityDocument = {
          _id: '123',
          _type: 'test',
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
          _rev: '123',
          defaultStyles: [
            {
              _type: 'block',
              _key: 'b0',
              style: 'normal',
              markDefs: [],
              children: [{_type: 'span', _key: 's0', text: 'Explicit normal text', marks: []}],
            },
            {
              _type: 'block',
              _key: 'b1',
              markDefs: [],
              children: [{_type: 'span', _key: 's1', text: 'Unstyled text', marks: []}],
            },
          ],
        }

        const {getFocusedPortableTextInput, waitForFocusedNodeText, waitForDocumentState} =
          testHelpers()
        void render(<StylesStory document={documentValue} />)
        const $portableTextInput = await getFocusedPortableTextInput('field-defaultStyles')
        const $firstText = [...$portableTextInput.element().querySelectorAll('*')].find(
          (node) => node.childElementCount === 0 && node.textContent === 'Explicit normal text',
        )
        await userEvent.click($firstText as HTMLElement)
        await userEvent.keyboard('{End}')
        await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
        await waitForFocusedNodeText('Unstyled text')

        const $styleSelectButton = $portableTextInput.getByTestId('block-style-select')
        await $styleSelectButton.click()
        const $menu = page.getByRole('menu')
        await $menu.getByText('Normal', {exact: true}).click()
        await expect.element($menu).not.toBeInTheDocument()

        // A no-op leaves no `onChange` to `waitFor`, so anchor on a keystroke
        // instead. Typed into block A, not B: typing normalizes the edited
        // block's own style, which would mask whether the no-op touched block
        // B's absent one.
        await userEvent.click($firstText as HTMLElement)
        await userEvent.keyboard('X')

        const documentState = await waitForDocumentState(
          (state) =>
            state?.defaultStyles?.[0]?.children?.[0]?.text?.length ===
            'Explicit normal text'.length + 1,
        )
        const typedText: string = documentState.defaultStyles[0].children[0].text
        expect(typedText.replace('X', '')).toBe('Explicit normal text')
        expect(documentState.defaultStyles).toEqual([
          {
            _type: 'block',
            _key: 'b0',
            style: 'normal',
            markDefs: [],
            children: [{_type: 'span', _key: 's0', text: typedText, marks: []}],
          },
          {
            _type: 'block',
            _key: 'b1',
            markDefs: [],
            children: [{_type: 'span', _key: 's1', text: 'Unstyled text', marks: []}],
          },
        ])
      })
    })
  })
})
