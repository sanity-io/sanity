import {EditorSelection, EditorState} from '@codemirror/state'
import {EditorView} from '@codemirror/view'
import {afterEach, describe, expect, test} from 'vitest'

import {redesignEditorTheme} from './editorTheme'

let view: EditorView | undefined

afterEach(() => {
  view?.destroy()
  view = undefined
})

describe('redesignEditorTheme', () => {
  test('marks the editor while text is selected, so the active line band steps aside', () => {
    view = new EditorView({
      state: EditorState.create({doc: '{\n  "a": 1\n}', extensions: [redesignEditorTheme]}),
      parent: document.body,
    })
    expect(view.dom.classList.contains('cm-vision-hasSelection')).toBe(false)

    view.dispatch({selection: EditorSelection.range(2, 6)})
    expect(view.dom.classList.contains('cm-vision-hasSelection')).toBe(true)

    view.dispatch({selection: EditorSelection.cursor(4)})
    expect(view.dom.classList.contains('cm-vision-hasSelection')).toBe(false)
  })
})
