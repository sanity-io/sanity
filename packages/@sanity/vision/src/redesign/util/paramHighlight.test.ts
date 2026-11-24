import {EditorSelection, EditorState} from '@codemirror/state'
import {EditorView} from '@codemirror/view'
import {groq} from '@sanity/lezer-groq'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {redesignEditorTheme} from './editorTheme'
import {
  jsonParamNameAt,
  PARAM_HIGHLIGHT_CLASS,
  paramReferences,
  paramsJsonActiveParam,
  queryParamHighlight,
  setHighlightedParam,
} from './paramHighlight'

const QUERY =
  '*[_type == $type && title match $search + "$type"] // $type\n{"t": $type2, "u": $type}'

let views: EditorView[] = []

afterEach(() => {
  for (const view of views) view.destroy()
  views = []
})

function mount(state: EditorState): EditorView {
  const view = new EditorView({state, parent: document.body})
  views.push(view)
  return view
}

function marked(view: EditorView): string[] {
  return [...view.contentDOM.querySelectorAll(`.${PARAM_HIGHLIGHT_CLASS}`)].map(
    (element) => element.textContent ?? '',
  )
}

describe('paramReferences', () => {
  test('finds the references to one param, not in strings, comments or longer names', () => {
    const state = EditorState.create({doc: QUERY, extensions: [groq()]})
    const texts = paramReferences(state, 'type').map(({from, to}) => state.sliceDoc(from, to))
    expect(texts).toEqual(['$type', '$type'])
    expect(paramReferences(state, 'search')).toHaveLength(1)
    expect(paramReferences(state, 'missing')).toEqual([])
  })
})

describe('queryParamHighlight', () => {
  test('marks the param set by the effect and clears the mark with null', () => {
    const view = mount(EditorState.create({doc: QUERY, extensions: [groq(), queryParamHighlight]}))
    expect(marked(view)).toEqual([])

    view.dispatch({effects: setHighlightedParam.of('type')})
    expect(marked(view)).toEqual(['$type', '$type'])

    view.dispatch({effects: setHighlightedParam.of('search')})
    expect(marked(view)).toEqual(['$search'])

    view.dispatch({effects: setHighlightedParam.of(null)})
    expect(marked(view)).toEqual([])
  })

  test('leaves the selection, the document and the focus as they were', () => {
    const selection = EditorSelection.create([EditorSelection.range(3, 9)])
    const view = mount(
      EditorState.create({doc: QUERY, selection, extensions: [groq(), queryParamHighlight]}),
    )
    const outside = document.createElement('input')
    document.body.append(outside)
    outside.focus()

    view.dispatch({effects: setHighlightedParam.of('type')})

    expect(view.state.selection.eq(selection)).toBe(true)
    expect(view.state.doc.toString()).toBe(QUERY)
    expect(document.activeElement).toBe(outside)
    outside.remove()
  })

  test('follows edits to the query', () => {
    const view = mount(
      EditorState.create({doc: '*[_type == $type]', extensions: [groq(), queryParamHighlight]}),
    )
    view.dispatch({effects: setHighlightedParam.of('type')})
    view.dispatch({changes: {from: 17, insert: '[$type]'}})
    expect(marked(view)).toEqual(['$type', '$type'])
  })

  test('styles the mark with a faint primary tint and hairline outline', () => {
    mount(EditorState.create({doc: '', extensions: [redesignEditorTheme]}))
    const sheets = [...document.styleSheets, ...(document.adoptedStyleSheets ?? [])]
    const rule = sheets
      .flatMap((sheet) => [...sheet.cssRules])
      .find(
        (candidate): candidate is CSSStyleRule =>
          candidate instanceof CSSStyleRule &&
          candidate.selectorText.includes(`.cm-editor .${PARAM_HIGHLIGHT_CLASS}`),
      )
    expect(rule?.style.backgroundColor).toContain('var(--card-badge-primary-fg-color)')
    expect(rule?.style.boxShadow).toContain('var(--card-badge-primary-fg-color)')
  })
})

describe('jsonParamNameAt', () => {
  const json = '{\n  "type": "post",\n  "search": ["a", {"type": 1}],\n  "a\\"b": 2\n}'

  test.each([
    ['in a key', json.indexOf('type') + 1, 'type'],
    ['before the key quote', json.indexOf('"type"'), 'type'],
    ['in a value', json.indexOf('post') + 2, 'type'],
    ['right before the comma', json.indexOf('",') + 1, 'type'],
    ['in a nested value with the same key', json.indexOf('{"type"') + 3, 'search'],
    ['in an escaped key', json.indexOf('2'), 'a"b'],
  ])('names the entry when the cursor is %s', (_label, pos, name) => {
    expect(jsonParamNameAt(json, pos)).toBe(name)
  })

  test('names nothing between entries or outside the object', () => {
    expect(jsonParamNameAt(json, 1)).toBeNull()
    expect(jsonParamNameAt(json, json.indexOf(',') + 1)).toBeNull()
    expect(jsonParamNameAt(json, 0)).toBeNull()
    expect(jsonParamNameAt('[{"a": 1}]', 4)).toBeNull()
  })

  test('still answers while the JSON is being typed', () => {
    expect(jsonParamNameAt('{"search": "unterminated', 14)).toBe('search')
    expect(jsonParamNameAt('{"a": 1, "sea', 12)).toBe('sea')
  })
})

describe('paramsJsonActiveParam', () => {
  test('reports the entry the cursor is in while focused, and null on blur', () => {
    const onChange = vi.fn()
    const doc = '{\n  "type": "post",\n  "search": "x"\n}'
    const view = mount(EditorState.create({doc, extensions: [paramsJsonActiveParam(onChange)]}))

    view.focus()
    view.dispatch({selection: EditorSelection.cursor(doc.indexOf('post'))})
    expect(onChange).toHaveBeenLastCalledWith('type')

    view.dispatch({selection: EditorSelection.cursor(doc.indexOf('"x"'))})
    expect(onChange).toHaveBeenLastCalledWith('search')

    view.contentDOM.blur()
    view.dispatch({})
    expect(onChange).toHaveBeenLastCalledWith(null)
  })
})
