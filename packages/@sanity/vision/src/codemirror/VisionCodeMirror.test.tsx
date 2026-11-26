import {history, undo} from '@codemirror/commands'
import {type Extension} from '@codemirror/state'
import {EditorView} from '@codemirror/view'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {act, render} from '@testing-library/react'
import {Activity, type RefObject} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {VisionCodeMirror, type VisionCodeMirrorHandle} from './VisionCodeMirror'

const NO_EXTENSIONS: Extension[] = []

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

    // A pasted query URL replaces the query like this
    act(() => ref.current?.resetEditorContent('*[_type == "author"] | order(name asc)'))
    expect(content()).toBe('*[_type == "author"] | order(name asc)')

    const view = EditorView.findFromDOM(container)
    let undone: boolean | undefined
    act(() => {
      undone = view ? undo(view) : false
    })
    expect(undone).toBe(true)
    expect(content()).toBe('*[_type == "post"]')
    // Destroying the view cancels the measuring that undo scheduled, which jsdom cannot do
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
})
