import {history, undo} from '@codemirror/commands'
import {type Extension} from '@codemirror/state'
import {EditorView} from '@codemirror/view'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {act, render} from '@testing-library/react'
import {Activity, type RefObject} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {historyCompartment} from './extensions'
import {VisionCodeMirror, type VisionCodeMirrorHandle} from './VisionCodeMirror'

const NO_EXTENSIONS: Extension[] = []
/** The undo history as the editors have it, in the compartment a document switch reconfigures */
const HISTORY: Extension[] = [historyCompartment.of(history())]

function editor(
  mode: 'visible' | 'hidden',
  ref: RefObject<VisionCodeMirrorHandle | null>,
  onChange: () => void,
  initialValue = '',
  extensions = NO_EXTENSIONS,
  stateKey?: string,
) {
  return (
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    <ThemeProvider theme={studioTheme}>
      <Activity mode={mode}>
        <VisionCodeMirror
          ref={ref}
          initialValue={initialValue}
          onChange={onChange}
          extensions={extensions}
          stateKey={stateKey}
        />
      </Activity>
    </ThemeProvider>
  )
}

/** Edits the document the way typing does: recorded in the undo history, reported as a change */
function type(view: EditorView, insert: string) {
  view.dispatch({
    changes: {from: view.state.doc.length, insert},
    selection: {anchor: view.state.doc.length + insert.length},
    userEvent: 'input.type',
  })
}

describe('VisionCodeMirror', () => {
  it('replaces its document in one step that undo takes back', () => {
    const ref: RefObject<VisionCodeMirrorHandle | null> = {current: null}
    const {container, unmount} = render(
      editor('visible', ref, vi.fn(), '*[_type == "post"]', [history()]),
    )
    const content = () => container.querySelector('.cm-content')?.textContent

    // A generated query replaces the tab's query like this
    act(() => ref.current?.resetEditorContent('*[_type == "author"] | order(name asc)'))
    expect(content()).toBe('*[_type == "author"] | order(name asc)')

    let undone: boolean | undefined
    act(() => {
      undone = ref.current?.runCommand(undo)
    })
    expect(undone).toBe(true)
    expect(content()).toBe('*[_type == "post"]')
    // Destroying the view cancels the measuring that undo scheduled, which jsdom cannot do
    unmount()
  })

  it('lines its gutters up with the text in the commit that creates the view', () => {
    const padding = EditorView.theme({'.cm-content': {paddingTop: '32px'}})
    const {container, unmount} = render(editor('visible', {current: null}, vi.fn(), '*', [padding]))
    const view = EditorView.findFromDOM(container.querySelector('.cm-editor') as HTMLElement)

    // The gutters are placed from the padding the view has read, which it would otherwise only
    // read in an animation frame after the first paint
    expect(view?.documentPadding.top).toBe(32)
    unmount()
  })

  it('keeps its document when hidden and shown again inside an Activity boundary', () => {
    const ref: RefObject<VisionCodeMirrorHandle | null> = {current: null}
    const onChange = vi.fn()
    const {container, rerender} = render(editor('visible', ref, onChange))
    const content = () => container.querySelector('.cm-content')?.textContent

    act(() => ref.current?.resetEditorContent('*[_type == "author"]'))
    expect(content()).toBe('*[_type == "author"]')
    expect(onChange).toHaveBeenLastCalledWith('*[_type == "author"]', expect.anything())

    // Hiding tears the effects down (react-codemirror destroys its view); showing re-creates them.
    rerender(editor('hidden', ref, onChange))
    rerender(editor('visible', ref, onChange))

    expect(content()).toBe('*[_type == "author"]')
  })

  it('shows an initialValue that changed while hidden, and only then', () => {
    const ref: RefObject<VisionCodeMirrorHandle | null> = {current: null}
    const onChange = vi.fn()
    const {container, rerender} = render(editor('visible', ref, onChange, '*'))
    const content = () => container.querySelector('.cm-content')?.textContent
    expect(content()).toBe('*')

    // While the view is alive the prop only seeded it: the document is the source of truth
    rerender(editor('visible', ref, onChange, '*[_type == "book"]'))
    expect(content()).toBe('*')

    // Prettify can finish while the tool is hidden: the handle is detached with the effects, so
    // the formatted query only arrives as a new initialValue, which the next view must show
    rerender(editor('hidden', ref, onChange, '*'))
    expect(ref.current).toBeNull()
    rerender(editor('hidden', ref, onChange, '*[_type == "author"]'))
    rerender(editor('visible', ref, onChange, '*[_type == "author"]'))

    expect(content()).toBe('*[_type == "author"]')
    // The parent already holds that value; nothing is echoed back as an edit
    expect(onChange).not.toHaveBeenCalled()
  })

  describe('stateKey', () => {
    it('shows the document kept for a key, or initialValue for a new one, in the same view', () => {
      const ref: RefObject<VisionCodeMirrorHandle | null> = {current: null}
      const onChange = vi.fn()
      const {container, rerender, unmount} = render(
        editor('visible', ref, onChange, '*[_type == "author"]', HISTORY, 'a'),
      )
      const editorElement = () => container.querySelector('.cm-editor') as HTMLElement
      const view = EditorView.findFromDOM(editorElement()) as EditorView
      const content = () => view.state.doc.toString()
      act(() => type(view, ' | order(name)'))
      act(() => view.dispatch({selection: {anchor: 3}}))
      expect(onChange).toHaveBeenCalledTimes(1)

      // Another tab, whose query the editor has not shown yet: its initialValue, in the view
      // that is already on the page, with the cursor at the end
      rerender(editor('visible', ref, onChange, '*[_type == "book"]', HISTORY, 'b'))
      expect(EditorView.findFromDOM(editorElement())).toBe(view)
      expect(content()).toBe('*[_type == "book"]')
      expect(view.state.selection.main.head).toBe('*[_type == "book"]'.length)
      act(() => type(view, '[0]'))

      // Back to the first: the document as it was left, with its selection
      rerender(editor('visible', ref, onChange, '*[_type == "author"] | order(name)', HISTORY, 'a'))
      expect(EditorView.findFromDOM(editorElement())).toBe(view)
      expect(content()).toBe('*[_type == "author"] | order(name)')
      expect(view.state.selection.main.head).toBe(3)

      rerender(editor('visible', ref, onChange, '*[_type == "book"][0]', HISTORY, 'b'))
      expect(content()).toBe('*[_type == "book"][0]')
      // Showing another document is not an edit; the two typed changes were the only ones
      expect(onChange).toHaveBeenCalledTimes(2)
      unmount()
    })

    it('keeps an undo history per key', () => {
      const ref: RefObject<VisionCodeMirrorHandle | null> = {current: null}
      const {container, rerender, unmount} = render(
        editor('visible', ref, vi.fn(), 'a', HISTORY, 'a'),
      )
      const view = EditorView.findFromDOM(
        container.querySelector('.cm-editor') as HTMLElement,
      ) as EditorView
      const undone = () => {
        let result: boolean | undefined
        act(() => {
          result = ref.current?.runCommand(undo)
        })
        return result
      }
      act(() => type(view, '1'))
      expect(view.state.doc.toString()).toBe('a1')

      // A new document starts with nothing to undo: the first tab's edits are not its own
      rerender(editor('visible', ref, vi.fn(), 'b', HISTORY, 'b'))
      expect(undone()).toBe(false)
      expect(view.state.doc.toString()).toBe('b')
      act(() => type(view, '2'))

      // Each document's own history comes back with it
      rerender(editor('visible', ref, vi.fn(), 'a1', HISTORY, 'a'))
      expect(undone()).toBe(true)
      expect(view.state.doc.toString()).toBe('a')
      expect(undone()).toBe(false)

      rerender(editor('visible', ref, vi.fn(), 'b2', HISTORY, 'b'))
      expect(undone()).toBe(true)
      expect(view.state.doc.toString()).toBe('b')
      unmount()
    })

    it('shows initialValue rather than a kept document that was changed from outside', () => {
      const ref: RefObject<VisionCodeMirrorHandle | null> = {current: null}
      const {container, rerender, unmount} = render(
        editor('visible', ref, vi.fn(), 'a', HISTORY, 'a'),
      )
      const view = EditorView.findFromDOM(
        container.querySelector('.cm-editor') as HTMLElement,
      ) as EditorView
      act(() => type(view, '1'))
      rerender(editor('visible', ref, vi.fn(), 'b', HISTORY, 'b'))

      // The first tab's query was replaced meanwhile (a loaded history entry): the parent's value
      // wins, and the old history, recorded against other text, is not replayed on it
      rerender(editor('visible', ref, vi.fn(), 'loaded', HISTORY, 'a'))
      expect(view.state.doc.toString()).toBe('loaded')
      let undone: boolean | undefined
      act(() => {
        undone = ref.current?.runCommand(undo)
      })
      expect(undone).toBe(false)
      unmount()
    })
  })
})
