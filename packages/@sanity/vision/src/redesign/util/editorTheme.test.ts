import {bracketMatching} from '@codemirror/language'
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

  test.each([
    ['matching', '[1]', 'cm-matchingBracket', '--card-muted-fg-color'],
    ['non-matching', '[1}', 'cm-nonmatchingBracket', '--card-badge-critical-fg-color'],
  ])(
    'marks a %s bracket with a faint tint and hairline outline from the card tokens',
    (_label, doc, className, token) => {
      view = new EditorView({
        state: EditorState.create({
          doc,
          selection: EditorSelection.cursor(0),
          extensions: [bracketMatching(), redesignEditorTheme],
        }),
        parent: document.body,
      })
      view.focus()
      expect(view.contentDOM.querySelector(`.${className}`)).not.toBeNull()

      const rule = themeRules().find(
        (candidate) =>
          candidate.selectorText.includes(`.cm-editor.cm-focused .${className}`) &&
          candidate.style.backgroundColor !== '',
      )
      expect(rule).toBeDefined()
      expect(rule?.style.backgroundColor).toContain(`var(${token})`)
      expect(rule?.style.boxShadow).toContain(`var(${token})`)
      expect(rule?.style.color).toBe('')
    },
  )
})

function themeRules(): CSSStyleRule[] {
  const sheets = [...document.styleSheets, ...(document.adoptedStyleSheets ?? [])]
  return sheets.flatMap((sheet) =>
    [...sheet.cssRules].filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule),
  )
}
