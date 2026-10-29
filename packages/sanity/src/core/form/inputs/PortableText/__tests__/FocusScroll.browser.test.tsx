import {configure} from '@chromatic-com/vitest'
import {
  defineArrayMember,
  defineField,
  defineType,
  type Path,
  type PortableTextBlock,
  type SanityDocument,
} from '@sanity/types'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {expectStable} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

// These tests assert scroll offsets, not rendered states: the end state is the same DOM at a
// different scroll position, so archiving it would only add snapshots that drift with the
// browser's layout of the filler blocks.
configure({disableAutoSnapshot: true})

const SCHEMA_TYPES = [
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
            marks: {
              annotations: [
                defineArrayMember({
                  type: 'object',
                  name: 'link',
                  title: 'Link',
                  fields: [defineField({type: 'string', name: 'href', title: 'Link'})],
                }),
              ],
            },
          }),
        ],
      }),
    ],
  }),
]

const LINK_KEY = 'link-annotation'
const LINK_BLOCK_KEY = 'block-with-link'

/** The href field of the annotation, the path focused when its URL input takes focus. */
const LINK_HREF_PATH: Path = ['body', {_key: LINK_BLOCK_KEY}, 'markDefs', {_key: LINK_KEY}, 'href']

// Enough text that the editor is taller than the pane it sits in once it grows with its content.
const FILLER_BLOCKS: PortableTextBlock[] = Array.from({length: 60}, (_, index) => ({
  _type: 'block',
  _key: `filler-${index}`,
  markDefs: [],
  children: [{_type: 'span', _key: `filler-span-${index}`, text: `Paragraph ${index + 1}`}],
}))

const DOCUMENT: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: '123',
  body: [
    ...FILLER_BLOCKS,
    {
      _type: 'block',
      _key: LINK_BLOCK_KEY,
      markDefs: [{_type: 'link', _key: LINK_KEY, href: 'https://www.sanity.io'}],
      children: [{_type: 'span', _key: 'link-span', text: 'test link', marks: [LINK_KEY]}],
    },
  ],
}

/**
 * The layout overrides from SAPP-4475: the editor grows with its content instead of scrolling
 * internally, and its toolbar sticks to the top of the surrounding scroll container.
 */
const GROW_WITH_CONTENT_CSS = `
  [data-testid='pt-editor'][data-fullscreen='false'] {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }

  [data-testid='pt-editor__toolbar-card'] {
    position: sticky;
    top: 0;
    z-index: 10;
  }
`

/**
 * Pushes the field below the fold, with room below it so that the scroll container can align
 * the editor's top rather than running out of scroll.
 */
const PUSH_FIELD_BELOW_THE_FOLD_CSS = `
  [data-testid='field-body'] {
    margin-top: 1200px;
    margin-bottom: 1200px;
  }
`

const SCROLLER_TESTID = 'pane-scroller'

/**
 * The form is rendered in a scroll container of its own, standing in for the document pane's:
 * the mock studio the wrapper builds has no ancestor with a definite height, so nothing below
 * it can scroll.
 */
function FocusScrollHarness({css, focusPath}: {css: string; focusPath?: Path}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <style>{css}</style>
      <div data-testid={SCROLLER_TESTID} style={{height: 600, overflow: 'auto'}}>
        <TestForm document={DOCUMENT} focusPath={focusPath} />
      </div>
    </TestWrapper>
  )
}

/** Whether `target` is within the visible box of `container`, as the user sees it. */
function isWithin(target: Element, container: Element): boolean {
  const targetRect = target.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  return targetRect.top >= containerRect.top && targetRect.bottom <= containerRect.bottom
}

/** The scroll container the form is rendered in, once its scrolling has come to rest. */
async function getSettledPaneScroller(): Promise<HTMLElement> {
  const scroller = page.getByTestId(SCROLLER_TESTID).element() as HTMLElement
  await expectStable(() => Math.round(scroller.scrollTop))
  return scroller
}

describe('Portable Text Input', () => {
  describe('focus path scrolling', () => {
    it('keeps a focused annotation in view in an editor that grows with its content', async () => {
      const {rerender} = await render(<FocusScrollHarness css={GROW_WITH_CONTENT_CSS} />)

      const $link = page.getByText('test link')
      await expect.element($link).toBeInTheDocument()

      const scroller = await getSettledPaneScroller()
      const editor = page.getByTestId('pt-editor').element()
      // The premise of the bug: the editor cannot be revealed as a whole, because it is taller
      // than the scroll container around it.
      expect(editor.getBoundingClientRect().height).toBeGreaterThan(scroller.clientHeight)

      // Scroll to the link near the end of the editor, the way the user does before editing it.
      scroller.scrollTop = scroller.scrollHeight
      const scrollTop = await expectStable(() => Math.round(scroller.scrollTop))
      expect(isWithin($link.element(), scroller)).toBe(true)

      // Focusing the URL input of the link's annotation moves the form focus path into it.
      await rerender(<FocusScrollHarness css={GROW_WITH_CONTENT_CSS} focusPath={LINK_HREF_PATH} />)
      // The popover hides itself when the link it points at is scrolled out of view, so it
      // staying visible is the user-facing symptom this guards.
      await expect.element(page.getByTestId('popover-edit-dialog')).toBeVisible()

      await expectStable(() => Math.round(scroller.scrollTop))
      expect(isWithin($link.element(), scroller)).toBe(true)
      expect(Math.round(scroller.scrollTop)).toBe(scrollTop)
    })

    it('scrolls a focused annotation into view in an editor that grows with its content', async () => {
      const {rerender} = await render(<FocusScrollHarness css={GROW_WITH_CONTENT_CSS} />)

      const $link = page.getByText('test link')
      await expect.element($link).toBeInTheDocument()

      const scroller = await getSettledPaneScroller()
      scroller.scrollTop = 0
      await expectStable(() => Math.round(scroller.scrollTop))
      expect(isWithin($link.element(), scroller)).toBe(false)

      await rerender(<FocusScrollHarness css={GROW_WITH_CONTENT_CSS} focusPath={LINK_HREF_PATH} />)

      await expect.poll(() => isWithin($link.element(), scroller)).toBe(true)
      await expect.element(page.getByTestId('popover-edit-dialog')).toBeVisible()
    })

    it('reveals an editor that scrolls internally when focus arrives from outside it', async () => {
      const {rerender} = await render(<FocusScrollHarness css={PUSH_FIELD_BELOW_THE_FOLD_CSS} />)

      const $link = page.getByText('test link')
      await expect.element($link).toBeInTheDocument()

      const scroller = await getSettledPaneScroller()
      const editorScroller = page.getByTestId('pt-editor__scroller').element()
      // The editor keeps its own scroll here, so it fits in the pane and can be revealed whole.
      expect(editorScroller.getBoundingClientRect().height).toBeLessThan(scroller.clientHeight)
      expect(isWithin(editorScroller, scroller)).toBe(false)

      await rerender(
        <FocusScrollHarness css={PUSH_FIELD_BELOW_THE_FOLD_CSS} focusPath={LINK_HREF_PATH} />,
      )

      // The editor is aligned to the top of the pane, and its own scroll shows the annotation.
      await expect
        .poll(() =>
          Math.abs(
            Math.round(
              editorScroller.getBoundingClientRect().top - scroller.getBoundingClientRect().top,
            ),
          ),
        )
        .toBe(0)
      expect(isWithin($link.element(), editorScroller)).toBe(true)
    })
  })
})
