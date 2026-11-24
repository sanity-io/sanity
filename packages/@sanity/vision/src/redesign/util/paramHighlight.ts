import {syntaxTree} from '@codemirror/language'
import {
  type EditorState,
  type Extension,
  RangeSetBuilder,
  StateEffect,
  StateField,
} from '@codemirror/state'
import {Decoration, type DecorationSet, EditorView} from '@codemirror/view'

export const PARAM_HIGHLIGHT_CLASS = 'cm-vision-paramMatch'

/** Sets the param, by name without the `$`, whose references the query editor marks */
export const setHighlightedParam = StateEffect.define<string | null>()

const highlightedParam = StateField.define<string | null>({
  create: () => null,
  update(value, tr) {
    let next = value
    for (const effect of tr.effects) if (effect.is(setHighlightedParam)) next = effect.value
    return next
  },
})

/** The ranges of the query's `$name` references, leaving out strings and comments */
export function paramReferences(
  state: EditorState,
  name: string,
): readonly {from: number; to: number}[] {
  const target = `$${name}`
  const ranges: {from: number; to: number}[] = []
  syntaxTree(state).iterate({
    enter(node) {
      if (node.name === 'Parameter' && state.sliceDoc(node.from, node.to) === target) {
        ranges.push({from: node.from, to: node.to})
      }
    },
  })
  return ranges
}

const paramMark = Decoration.mark({class: PARAM_HIGHLIGHT_CLASS})

function paramDecorations(state: EditorState): DecorationSet {
  const name = state.field(highlightedParam)
  if (!name) return Decoration.none
  const builder = new RangeSetBuilder<Decoration>()
  for (const {from, to} of paramReferences(state, name)) builder.add(from, to, paramMark)
  return builder.finish()
}

const paramHighlightDecorations = StateField.define<DecorationSet>({
  create: paramDecorations,
  update(decorations, tr) {
    const changed =
      tr.docChanged ||
      tr.startState.field(highlightedParam) !== tr.state.field(highlightedParam) ||
      syntaxTree(tr.startState) !== syntaxTree(tr.state)
    return changed ? paramDecorations(tr.state) : decorations
  },
  provide: (field) => EditorView.decorations.from(field),
})

/**
 * Marks the query's references to the param being edited in the params pane. The param is set
 * with `setHighlightedParam`, which changes neither the document nor the selection.
 */
export const queryParamHighlight: Extension = [highlightedParam, paramHighlightDecorations]

/** The highlighted param of a query editor's state, `null` when none is */
export function highlightedParamOf(state: EditorState): string | null {
  return state.field(highlightedParam, false) ?? null
}

/** Index of the quote that ends the string starting at `start`, or the text's end */
function stringEnd(text: string, start: number): number {
  for (let i = start + 1; i < text.length; i++) {
    if (text[i] === '\\') i++
    else if (text[i] === '"') return i
  }
  return text.length
}

function keyName(raw: string): string {
  try {
    const parsed: unknown = JSON.parse(raw)
    return typeof parsed === 'string' ? parsed : raw.slice(1, -1)
  } catch {
    return raw.slice(1)
  }
}

/**
 * The top-level key of the params JSON whose key or value holds the position, `null` between
 * entries or outside the object. Scans the text rather than parsing it, so it still answers
 * while the JSON is being typed and does not parse.
 */
export function jsonParamNameAt(text: string, pos: number): string | null {
  const stack: string[] = []
  let expectKey = false
  let key: string | null = null
  let keyStart = -1
  const inEntry = (end: number) => key !== null && pos >= keyStart && pos <= end
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const topLevel = stack.length === 1 && stack[0] === '{'
    if (char === '"') {
      const end = stringEnd(text, i)
      if (topLevel && expectKey) {
        key = keyName(text.slice(i, end + 1))
        keyStart = i
        expectKey = false
      }
      i = end
    } else if (char === '{' || char === '[') {
      stack.push(char)
      if (stack.length === 1 && char === '{') expectKey = true
    } else if (char === '}' || char === ']') {
      if (topLevel && inEntry(i)) return key
      stack.pop()
      if (stack.length === 0) return null
    } else if (char === ',' && topLevel) {
      if (inEntry(i)) return key
      key = null
      expectKey = true
    }
  }
  return inEntry(text.length) ? key : null
}

/**
 * Reports the param the params JSON editor's cursor is in, as it moves, and `null` when the
 * editor loses focus
 */
export function paramsJsonActiveParam(onChange: (name: string | null) => void): Extension {
  return EditorView.updateListener.of((update) => {
    if (!update.focusChanged && !update.selectionSet && !update.docChanged) return
    onChange(
      update.view.hasFocus
        ? jsonParamNameAt(update.state.doc.toString(), update.state.selection.main.head)
        : null,
    )
  })
}
