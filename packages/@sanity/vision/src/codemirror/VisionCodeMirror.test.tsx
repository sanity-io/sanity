import {history, undoDepth} from '@codemirror/commands'
import {type Extension} from '@codemirror/state'
import {EditorView} from '@codemirror/view'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {act, render} from '@testing-library/react'
import {Activity, type RefObject} from 'react'
import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest'

import {VisionCodeMirror, type VisionCodeMirrorHandle} from './VisionCodeMirror'

beforeAll(() => {
  // jsdom's Range has no layout API. CodeMirror only measures text through it once a scroll
  // position is restored, which the Activity tests do; empty rects make it fall back to a dummy
  // element.
  Object.defineProperty(Range.prototype, 'getClientRects', {value: () => []})
})

afterEach(() => {
  vi.restoreAllMocks()
})

function editor(
  mode: 'visible' | 'hidden',
  ref: RefObject<VisionCodeMirrorHandle | null>,
  onChange: () => void,
  extensions: Extension[] = [],
  scheme: 'light' | 'dark' = 'light',
) {
  return (
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    <ThemeProvider theme={studioTheme} scheme={scheme}>
      <Activity mode={mode}>
        <VisionCodeMirror ref={ref} initialValue="" onChange={onChange} extensions={extensions} />
      </Activity>
    </ThemeProvider>
  )
}

describe('VisionCodeMirror', () => {
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

  it('keeps its selection and undo history when hidden and shown again', () => {
    const ref: RefObject<VisionCodeMirrorHandle | null> = {current: null}
    const onChange = vi.fn()
    const extensions = [history()]
    const {container, rerender} = render(editor('visible', ref, onChange, extensions))
    const view = () => EditorView.findFromDOM(container)!

    act(() => ref.current?.resetEditorContent('*[_type == "author"]'))
    act(() => view().dispatch({selection: {anchor: 2, head: 7}}))
    const hiddenView = view()
    expect(undoDepth(hiddenView.state)).toBe(1)

    rerender(editor('hidden', ref, onChange, extensions))
    rerender(editor('visible', ref, onChange, extensions))

    const shownView = view()
    expect(shownView).not.toBe(hiddenView)
    expect(shownView.state.doc.toString()).toBe('*[_type == "author"]')
    expect(shownView.state.selection.main).toMatchObject({anchor: 2, head: 7})
    expect(undoDepth(shownView.state)).toBe(1)
  })

  it('applies a theme change made while hidden when shown again', () => {
    const ref: RefObject<VisionCodeMirrorHandle | null> = {current: null}
    const onChange = vi.fn()
    const {container, rerender} = render(editor('visible', ref, onChange, [], 'light'))
    const view = () => EditorView.findFromDOM(container)!
    act(() => ref.current?.resetEditorContent('*[_type == "author"]'))
    expect(view().state.facet(EditorView.darkTheme)).toBe(false)

    rerender(editor('hidden', ref, onChange, [], 'light'))
    rerender(editor('hidden', ref, onChange, [], 'dark'))
    rerender(editor('visible', ref, onChange, [], 'dark'))

    expect(view().state.facet(EditorView.darkTheme)).toBe(true)
    expect(view().state.doc.toString()).toBe('*[_type == "author"]')
  })

  it('hands the scroll position of the hidden view to the one that replaces it', () => {
    const ref: RefObject<VisionCodeMirrorHandle | null> = {current: null}
    const {container, rerender} = render(editor('visible', ref, vi.fn()))
    const lines = Array.from({length: 200}, (_, index) => `"line${index}": ${index},`)
    act(() => ref.current?.resetEditorContent(lines.join('\n')))
    const hiddenView = EditorView.findFromDOM(container)!
    // jsdom has no layout, so the restored offset cannot be read back from the DOM; the snapshot
    // CodeMirror takes of this offset anchors below the first line, and the new view gets it.
    hiddenView.scrollDOM.scrollTop = 120
    const scrollSnapshot = vi.spyOn(EditorView.prototype, 'scrollSnapshot')
    const dispatch = vi.spyOn(EditorView.prototype, 'dispatch')

    rerender(editor('hidden', ref, vi.fn()))
    expect(scrollSnapshot).toHaveBeenCalledTimes(1)
    const snapshot = scrollSnapshot.mock.results[0].value
    expect(snapshot.value.range.anchor).toBeGreaterThan(0)

    rerender(editor('visible', ref, vi.fn()))
    const shownView = EditorView.findFromDOM(container)!
    expect(shownView).not.toBe(hiddenView)
    const restore = dispatch.mock.calls.findIndex(([spec]) => spec?.effects === snapshot)
    expect(restore).not.toBe(-1)
    expect(dispatch.mock.instances[restore]).toBe(shownView)
  })
})
