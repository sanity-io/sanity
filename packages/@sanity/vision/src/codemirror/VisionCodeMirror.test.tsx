import {history, undo} from '@codemirror/commands'
import {type Extension} from '@codemirror/state'
import {EditorView} from '@codemirror/view'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {act, render} from '@testing-library/react'
import {Activity, type RefObject} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {EDITOR_FONT_SIZE, firstEditorLineStyle} from './editorMetrics'
import {historyCompartment} from './extensions'
import {VisionCodeMirror, type VisionCodeMirrorHandle} from './VisionCodeMirror'

const NO_EXTENSIONS: Extension[] = []
/** The undo history as the tool's editors hold it */
const HISTORY: Extension[] = [historyCompartment.of(history())]

function editor(
  mode: 'visible' | 'hidden',
  ref: RefObject<VisionCodeMirrorHandle | null>,
  onChange: () => void,
  initialValue = '',
  extensions = NO_EXTENSIONS,
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
        />
      </Activity>
    </ThemeProvider>
  )
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

  it('starts its content flush under a header, and below a floating label otherwise', () => {
    const paddingTop = (underHeader: boolean) => {
      const {container, unmount} = render(
        // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
        <ThemeProvider theme={studioTheme}>
          <VisionCodeMirror
            initialValue=""
            onChange={vi.fn()}
            extensions={NO_EXTENSIONS}
            underHeader={underHeader}
          />
        </ThemeProvider>,
      )
      const root = container.firstElementChild as HTMLElement
      const value = root.style.getPropertyValue('--vision-editor-content-padding-top')
      unmount()
      return value
    }

    expect(paddingTop(true)).toBe('0px')
    expect(paddingTop(false)).not.toBe('0px')
    // Text set beside an editor under a header takes its first line's box from the same metrics
    expect(firstEditorLineStyle.paddingTop).toBe(paddingTop(true))
  })

  it('sizes its text from the shared editor metrics', () => {
    const {container, unmount} = render(editor('visible', {current: null}, vi.fn()))
    const root = container.firstElementChild as HTMLElement
    expect(root.style.getPropertyValue('--vision-editor-font-size')).toBe(`${EDITOR_FONT_SIZE}px`)
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

  it('brings back its selection and undo history when hidden and shown again', () => {
    const ref: RefObject<VisionCodeMirrorHandle | null> = {current: null}
    const {container, rerender, unmount} = render(editor('visible', ref, vi.fn(), '{}', HISTORY))
    const content = () => container.querySelector('.cm-content')?.textContent
    const view = () =>
      EditorView.findFromDOM(container.querySelector('.cm-editor') as HTMLElement) ?? undefined

    act(() => ref.current?.applyChanges([{from: 1, to: 1, insert: '"limit": 3'}]))
    act(() => ref.current?.selectRange(2, 7))
    const hiddenView = view()

    // A query tab switched away from and back to: the view is created again, with the old one's
    // selection and history rather than a cursor at the start and nothing to undo
    rerender(editor('hidden', ref, vi.fn(), '{}', HISTORY))
    rerender(editor('visible', ref, vi.fn(), '{}', HISTORY))
    expect(view()).not.toBe(hiddenView)
    expect(content()).toBe('{"limit": 3}')
    expect(view()?.state.selection.main).toMatchObject({from: 2, to: 7})

    let undone: boolean | undefined
    act(() => {
      undone = ref.current?.runCommand(undo)
    })
    expect(undone).toBe(true)
    expect(content()).toBe('{}')
    unmount()
  })

  it('starts over with a document that changed while hidden', () => {
    const ref: RefObject<VisionCodeMirrorHandle | null> = {current: null}
    const {container, rerender, unmount} = render(editor('visible', ref, vi.fn(), '*', HISTORY))
    act(() => ref.current?.applyChanges([{from: 1, to: 1, insert: '[0]'}]))

    rerender(editor('hidden', ref, vi.fn(), '*', HISTORY))
    rerender(editor('hidden', ref, vi.fn(), '*[_type == "author"]', HISTORY))
    rerender(editor('visible', ref, vi.fn(), '*[_type == "author"]', HISTORY))

    const view = EditorView.findFromDOM(container.querySelector('.cm-editor') as HTMLElement)
    expect(view?.state.selection.main.head).toBe(0)
    // The edits belonged to the replaced document
    expect(ref.current?.runCommand(undo)).toBe(false)
    unmount()
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
})
