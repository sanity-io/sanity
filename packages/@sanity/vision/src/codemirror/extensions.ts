import {closeBrackets} from '@codemirror/autocomplete'
import {defaultKeymap, history, historyKeymap} from '@codemirror/commands'
import {javascriptLanguage} from '@codemirror/lang-javascript'
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import {highlightSelectionMatches} from '@codemirror/search'
import {type Extension} from '@codemirror/state'
import {
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from '@codemirror/view'

export const codemirrorExtensions: Extension[] = [
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
  keymap.of(
    [
      // Override the default keymap for Mod-Enter to not insert a new line, we have a custom event handler for executing queries
      {key: 'Mod-Enter', run: () => true},

      // Add the default keymap and history keymap
      defaultKeymap,
      historyKeymap,
    ]
      .flat()
      .filter(Boolean),
  ),
]
