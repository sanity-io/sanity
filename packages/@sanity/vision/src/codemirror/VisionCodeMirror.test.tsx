import {studioTheme, ThemeProvider} from '@sanity/ui'
import {act, render} from '@testing-library/react'
import {Activity, type RefObject} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {VisionCodeMirror, type VisionCodeMirrorHandle} from './VisionCodeMirror'

function editor(
  mode: 'visible' | 'hidden',
  ref: RefObject<VisionCodeMirrorHandle | null>,
  onChange: () => void,
) {
  return (
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    <ThemeProvider theme={studioTheme}>
      <Activity mode={mode}>
        <VisionCodeMirror ref={ref} initialValue="" onChange={onChange} extensions={[]} />
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
})
