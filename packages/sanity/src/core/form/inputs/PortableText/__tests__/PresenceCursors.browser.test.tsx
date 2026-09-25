import {defineArrayMember, defineField, defineType, type SanityDocument} from '@sanity/types'
import {type FormNodePresence} from 'sanity'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {expectStable, testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {PresenceOverlay} from '../../../../presence/overlay/PresenceOverlay'

const schemaTypes = [
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
      }),
    ],
  }),
]

interface PresenceCursorsHarnessProps {
  presence: FormNodePresence[]
  document: SanityDocument
}

function PresenceCursorsHarness(props: PresenceCursorsHarnessProps) {
  const {document, presence} = props

  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <TestForm document={document} presence={presence} />
    </TestWrapper>
  )
}

const TEXT = 'Hello, this is some text in the editor.'

const DOCUMENT: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: '123',
  body: [
    {
      _type: 'block',
      _key: 'a',
      children: [{_type: 'span', _key: 'a1', text: TEXT}],
      markDefs: [],
    },
  ],
}

// A document long enough for its last block to be scrolled out of view inside the editor.
const LONG_DOCUMENT_BLOCK_COUNT = 80
const LONG_DOCUMENT: SanityDocument = {
  ...DOCUMENT,
  body: Array.from({length: LONG_DOCUMENT_BLOCK_COUNT}, (_, index) => ({
    _type: 'block',
    _key: `block-${index}`,
    children: [{_type: 'span', _key: `span-${index}`, text: `Block ${index + 1}: ${TEXT}`}],
    markDefs: [],
  })),
}

const LAST_BLOCK_KEY = `block-${LONG_DOCUMENT_BLOCK_COUNT - 1}`
const LAST_SPAN_KEY = `span-${LONG_DOCUMENT_BLOCK_COUNT - 1}`

const offset1 = TEXT.indexOf('this is')
const offset2 = TEXT.indexOf('some text')

const PRESENCE: FormNodePresence[] = [
  {
    path: ['body', 'text'],
    lastActiveAt: '2024-01-01T00:00:00.000Z',
    sessionId: 'session-A',
    selection: {
      anchor: {offset: offset1, path: [{_key: 'a'}, 'children', {_key: 'a1'}]},
      focus: {offset: offset1, path: [{_key: 'a'}, 'children', {_key: 'a1'}]},
      backward: false,
    },
    user: {
      id: 'user-A',
      displayName: 'User A',
    },
  },
  {
    path: ['body', 'text'],
    lastActiveAt: '2024-01-01T00:00:00.000Z',
    sessionId: 'session-B',
    selection: {
      anchor: {offset: offset2, path: [{_key: 'a'}, 'children', {_key: 'a1'}]},
      focus: {offset: offset2, path: [{_key: 'a'}, 'children', {_key: 'a1'}]},
      backward: false,
    },
    user: {
      id: 'user-B',
      displayName: 'User B',
    },
  },
]

/**
 * Renders the form inside a `PresenceOverlay` within a scroll container (like the document pane
 * does). With `fieldBelowFold` the form is surrounded by spacers, so the Portable Text field
 * starts out scrolled out of view and can be scrolled to any position in the pane.
 */
function DockedPresenceCursorsHarness(
  props: PresenceCursorsHarnessProps & {fieldBelowFold?: boolean},
) {
  const {document, fieldBelowFold, presence} = props

  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <div
        data-testid="presence-scroll-container"
        style={{height: '100vh', overflow: 'auto', position: 'relative'}}
      >
        <PresenceOverlay>
          {fieldBelowFold && <div style={{height: '150vh'}} />}
          <TestForm document={document} presence={presence} />
          {fieldBelowFold && <div style={{height: '100vh'}} />}
        </PresenceOverlay>
      </div>
    </TestWrapper>
  )
}

/** Avatars for the user that are actually within the pane's visible area */
function getVisibleAvatars(displayName: string) {
  const pane = document
    .querySelector('[data-testid="presence-scroll-container"]')!
    .getBoundingClientRect()

  return Array.from(document.querySelectorAll(`[title="${displayName}"]`)).filter((avatar) => {
    const rect = avatar.getBoundingClientRect()
    return rect.height > 0 && rect.bottom > pane.top && rect.top < pane.bottom
  })
}

/** Avatar docked at the edge of the pane overlay (outside the editor) */
function getPaneDockedAvatar(dock: 'top' | 'bottom', displayName: string) {
  return Array.from(
    document.querySelectorAll(`[data-dock="${dock}"] [title="${displayName}"]`),
  ).find((avatar) => !avatar.closest('[data-testid="pt-editor"]'))
}

/** Avatar docked at the edge of the fullscreen editor's own overlay */
function getEditorDockedAvatar(dock: 'top' | 'bottom', displayName: string) {
  return document.querySelector(
    `[data-testid="pt-editor"] [data-dock="${dock}"] [title="${displayName}"]`,
  )
}

/**
 * Avatar the pane overlay shows at the top or bottom edge of the editor, for a cursor that is
 * scrolled out of the editor's visible area (it is positioned over the editor, not inside it).
 */
function getAvatarAtEditorEdge(edge: 'top' | 'bottom', displayName: string) {
  const editor = document.querySelector('[data-testid="pt-editor"]')!.getBoundingClientRect()

  return Array.from(document.querySelectorAll(`[title="${displayName}"]`)).find((avatar) => {
    if (avatar.closest('[data-dock]')) return false
    const rect = avatar.getBoundingClientRect()
    return (
      avatar.getAttribute('data-arrow-position') === edge &&
      rect.top >= editor.top &&
      rect.bottom <= editor.bottom &&
      rect.left >= editor.left &&
      rect.right <= editor.right
    )
  })
}

function getSiblingTextContent() {
  const cursorA = document.querySelector('[data-testid="presence-cursor-User-A"]')
  const cursorB = document.querySelector('[data-testid="presence-cursor-User-B"]')

  return {
    cursorA: cursorA?.nextElementSibling?.nextElementSibling?.textContent,
    cursorB: cursorB?.nextElementSibling?.nextElementSibling?.textContent,
  }
}

async function settlePresenceSnapshot(options?: {
  styleSelectText?: RegExp
  styleSelectRoot?: string
}) {
  const {settleChromaticEndState, waitForPresenceGeometry} = testHelpers()
  await settleChromaticEndState(options)
  await waitForPresenceGeometry()
}

describe('Portable Text Input', () => {
  describe('Presence Cursors', () => {
    it('should keep position when inserting text in the editor', async () => {
      const {getFocusedPortableTextEditor, insertPortableText} = testHelpers()

      void render(<PresenceCursorsHarness document={DOCUMENT} presence={PRESENCE} />)

      const editor$ = await getFocusedPortableTextEditor('field-body')
      const $cursorA = page.getByTestId('presence-cursor-User-A')
      const $cursorB = page.getByTestId('presence-cursor-User-B')

      await expect.element($cursorA).toBeVisible()
      await expect.element($cursorB).toBeVisible()

      const siblingContentA = getSiblingTextContent()
      expect(siblingContentA.cursorA).toBe('this is ')
      expect(siblingContentA.cursorB).toBe('some text in the editor.')

      // Move the caret to the start of the editor so the insertion happens ahead
      // of both presence cursors (focusing the editable leaves the selection at
      // the end in this environment, unlike the original Playwright run).
      await userEvent.keyboard('{Control>}{Home}{/Control}')

      await insertPortableText('INSERTED TEXT. ', editor$)

      // Make sure that the cursors keep their position after inserting text
      const siblingContentB = getSiblingTextContent()
      expect(siblingContentB.cursorA).toBe('this is ')
      expect(siblingContentB.cursorB).toBe('some text in the editor.')

      // Re-assert presence markers for a settled Chromatic end state.
      await expect.element($cursorA).toBeVisible()
      await expect.element($cursorB).toBeVisible()
      await expect.element(editor$).toMatchTextContent(`INSERTED TEXT. ${TEXT}`)
      // Presence pin geometry can shift by a sub-pixel while the caret settles;
      // wait until both markers report a stable left offset.
      const presenceSig = () => {
        const a = window.document.querySelector('[data-testid="presence-cursor-User-A"]')
        const b = window.document.querySelector('[data-testid="presence-cursor-User-B"]')
        if (!(a instanceof HTMLElement) || !(b instanceof HTMLElement)) return ''
        return `${Math.round(a.getBoundingClientRect().left)}:${Math.round(b.getBoundingClientRect().left)}`
      }
      expect(await expectStable(presenceSig)).toMatch(/^\d+:\d+$/)
      // Toolbar enablement/style-select muted vs dark text flipped between
      // identical-code captures when focus/selection briefly unsettled.
      await userEvent.click(editor$)
      await settlePresenceSnapshot({
        styleSelectText: /^Normal$/,
        styleSelectRoot: '[data-testid="field-body"]',
      })
    })

    it.skip('should keep position when deleting text in the editor', async () => {
      // todo
    })

    it.skip('should keep position when pasting text i the editor', async () => {
      // todo
    })

    it.skip('should change position when updating the selection in the editor', async () => {
      // todo
    })
  })

  describe('Presence Cursors docking', () => {
    // Presence with the cursor in the last block of `LONG_DOCUMENT`, which is scrolled out of
    // view inside the editor until the editor itself is scrolled to the end.
    const LAST_BLOCK_PRESENCE: FormNodePresence[] = [
      {
        ...PRESENCE[0],
        selection: {
          anchor: {offset: 0, path: [{_key: LAST_BLOCK_KEY}, 'children', {_key: LAST_SPAN_KEY}]},
          focus: {offset: 0, path: [{_key: LAST_BLOCK_KEY}, 'children', {_key: LAST_SPAN_KEY}]},
          backward: false,
        },
      },
    ]

    it('should float the avatar at the pane edge when the field is off screen', async () => {
      void render(
        <DockedPresenceCursorsHarness
          document={DOCUMENT}
          fieldBelowFold
          presence={[PRESENCE[0]]}
        />,
      )

      // The field (and the cursor) start out below the fold, so the presence is docked at the
      // bottom of the pane overlay, pointing towards the field.
      await expect.poll(() => getPaneDockedAvatar('bottom', 'User A')).toBeDefined()
      expect(getPaneDockedAvatar('top', 'User A')).toBeUndefined()

      // Scroll the field into view: the cursor is visible in the editor, so no avatar is rendered
      // anywhere, neither by the pane overlay nor by the editor's own overlay.
      const scrollElement = page.getByTestId('presence-scroll-container').element()
      page.getByTestId('pt-editor').element().scrollIntoView({block: 'center'})

      await expect.element(page.getByTestId('presence-cursor-User-A')).toBeVisible()
      await expect.poll(() => getPaneDockedAvatar('bottom', 'User A')).toBeUndefined()
      expect(document.querySelectorAll('[title="User A"]')).toHaveLength(0)

      // Scroll back up: the field is below the fold again and the avatar floats again.
      scrollElement.scrollTop = 0
      await expect.poll(() => getPaneDockedAvatar('bottom', 'User A')).toBeDefined()
      await settlePresenceSnapshot()
    })

    it('should dock the avatar inside the editor when only the cursor is off screen', async () => {
      void render(
        <DockedPresenceCursorsHarness document={LONG_DOCUMENT} presence={LAST_BLOCK_PRESENCE} />,
      )

      // The field is in view but the cursor in the last block is scrolled out of the editor's
      // visible area, so the avatar is shown at the bottom edge of the editor, not of the pane.
      await expect.poll(() => getAvatarAtEditorEdge('bottom', 'User A')).toBeDefined()
      expect(getPaneDockedAvatar('bottom', 'User A')).toBeUndefined()
      expect(getPaneDockedAvatar('top', 'User A')).toBeUndefined()
      expect(getVisibleAvatars('User A')).toHaveLength(1)

      // Scroll the editor to the end: the cursor is in view, so the avatar goes away.
      const editorScroller = page.getByTestId('pt-editor__scroller').element()
      editorScroller.scrollTop = editorScroller.scrollHeight

      await expect.element(page.getByTestId('presence-cursor-User-A')).toBeVisible()
      await expect.poll(() => document.querySelectorAll('[title="User A"]')).toHaveLength(0)

      // Scroll back to the start: the cursor is below the editor's visible area again.
      editorScroller.scrollTop = 0
      await expect.poll(() => getAvatarAtEditorEdge('bottom', 'User A')).toBeDefined()
      expect(getVisibleAvatars('User A')).toHaveLength(1)
      await settlePresenceSnapshot()
    })

    it('should show every user whose cursor is hidden at the same editor edge', async () => {
      // Two users with their cursors in the last block, both scrolled out of the editor's view
      const presence: FormNodePresence[] = [
        LAST_BLOCK_PRESENCE[0],
        {...LAST_BLOCK_PRESENCE[0], ...PRESENCE[1], selection: LAST_BLOCK_PRESENCE[0].selection},
      ]
      void render(<DockedPresenceCursorsHarness document={LONG_DOCUMENT} presence={presence} />)

      // Both avatars share the spot at the editor's bottom edge, stacked like in a dock
      await expect.poll(() => getAvatarAtEditorEdge('bottom', 'User A')).toBeDefined()
      await expect.poll(() => getAvatarAtEditorEdge('bottom', 'User B')).toBeDefined()
      expect(getVisibleAvatars('User A')).toHaveLength(1)
      expect(getVisibleAvatars('User B')).toHaveLength(1)
      expect(document.querySelector('[data-ui="AvatarCounter"]')).toBeNull()
      await settlePresenceSnapshot()
    })

    it('should hand over between the editor and the pane docks without duplicates', async () => {
      void render(
        <DockedPresenceCursorsHarness
          document={LONG_DOCUMENT}
          fieldBelowFold
          presence={LAST_BLOCK_PRESENCE}
        />,
      )

      // Field below the fold: the pane floats the avatar at its bottom edge, and the editor's own
      // docked avatar is scrolled out of view along with the editor.
      await expect.poll(() => getPaneDockedAvatar('bottom', 'User A')).toBeDefined()
      expect(getVisibleAvatars('User A')).toHaveLength(1)

      // Field fully in view with the cursor hidden inside the editor: only the avatar at the
      // editor's bottom edge.
      const pane = page.getByTestId('presence-scroll-container').element()
      const editor = page.getByTestId('pt-editor').element()
      editor.scrollIntoView({block: 'center'})

      await expect.poll(() => getPaneDockedAvatar('bottom', 'User A')).toBeUndefined()
      await expect.poll(() => getAvatarAtEditorEdge('bottom', 'User A')).toBeDefined()
      expect(getVisibleAvatars('User A')).toHaveLength(1)

      // Field partially scrolled out at the top, with its bottom edge still visible: the avatar
      // stays at the editor's bottom edge and the pane must not take over yet.
      const paneRect = pane.getBoundingClientRect()
      pane.scrollTop += editor.getBoundingClientRect().top - paneRect.top + 100

      await new Promise((resolve) => setTimeout(resolve, 200))
      expect(getAvatarAtEditorEdge('bottom', 'User A')).toBeDefined()
      expect(getPaneDockedAvatar('top', 'User A')).toBeUndefined()
      expect(getPaneDockedAvatar('bottom', 'User A')).toBeUndefined()
      expect(getVisibleAvatars('User A')).toHaveLength(1)

      // Only the last few pixels of the field visible, the spot at the editor's bottom edge is
      // hidden: now the pane floats the avatar at its top edge, and nothing else is visible.
      pane.scrollTop += editor.getBoundingClientRect().bottom - paneRect.top - 4

      await expect.poll(() => getPaneDockedAvatar('top', 'User A')).toBeDefined()
      expect(getVisibleAvatars('User A')).toHaveLength(1)
      await settlePresenceSnapshot()
    })

    it('should dock the avatar inside the fullscreen editor when the cursor is off screen', async () => {
      void render(
        <PresenceCursorsHarness document={LONG_DOCUMENT} presence={LAST_BLOCK_PRESENCE} />,
      )

      await page.getByLabelText('Expand editor').click()
      await expect.element(page.getByTestId('pt-editor')).toHaveAttribute('data-fullscreen', 'true')

      // The cursor in the last block is scrolled out of view inside the fullscreen editor, so it
      // docks at the bottom edge of the editor.
      await expect.poll(() => getEditorDockedAvatar('bottom', 'User A')).not.toBeNull()

      // Scroll the editor to the end: the cursor is in view, so the docked avatar goes away.
      const editorScroller = page.getByTestId('pt-editor__scroller').element()
      editorScroller.scrollTop = editorScroller.scrollHeight

      await expect.element(page.getByTestId('presence-cursor-User-A')).toBeVisible()
      await expect.poll(() => getEditorDockedAvatar('bottom', 'User A')).toBeNull()
      expect(document.querySelectorAll('[title="User A"]')).toHaveLength(0)

      // Scroll back to the start: the cursor is below the visible area and docks again.
      editorScroller.scrollTop = 0
      await expect.poll(() => getEditorDockedAvatar('bottom', 'User A')).not.toBeNull()
      await settlePresenceSnapshot()
    })
  })
})
