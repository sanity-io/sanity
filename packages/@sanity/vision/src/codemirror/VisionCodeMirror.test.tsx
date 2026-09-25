import {studioTheme, ThemeProvider} from '@sanity/ui'
import {act, render} from '@testing-library/react'
import {Activity, type RefObject} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {VisionCodeMirror, type VisionCodeMirrorHandle} from './VisionCodeMirror'

function editor(
  mode: 'visible' | 'hidden',
  ref: RefObject<VisionCodeMirrorHandle | null>,
  onChange: () => void,
  initialValue = '',
) {
  return (
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    <ThemeProvider theme={studioTheme}>
      <Activity mode={mode}>
        <VisionCodeMirror
          ref={ref}
          initialValue={initialValue}
          onChange={onChange}
          extensions={[]}
        />
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
