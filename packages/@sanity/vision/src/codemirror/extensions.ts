import {history, defaultKeymap, historyKeymap} from '@codemirror/commands'
import {highlightSelectionMatches} from '@codemirror/search'
import {javascriptLanguage} from '@codemirror/lang-javascript'
import {closeBrackets} from '@codemirror/autocomplete'
import {
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  keymap,
} from '@codemirror/view'
import {
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
} from '@codemirror/language'

export const codemirrorExtensions = [
  [javascriptLanguage],
  lineNumbers(),
  highlightActiveLine(),
  highlightActiveLineGutter(),
  highlightSelectionMatches(),
  highlightSpecialChars(),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  history(),
  drawSelection(),
  syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
  keymap.of([defaultKeymap, historyKeymap].flat().filter(Boolean)),
]
