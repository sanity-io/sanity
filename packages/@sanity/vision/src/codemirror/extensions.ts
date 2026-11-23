import {closeBrackets} from '@codemirror/autocomplete'
import {defaultKeymap, history, historyKeymap} from '@codemirror/commands'
import {javascriptLanguage} from '@codemirror/lang-javascript'
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import {highlightSelectionMatches} from '@codemirror/search'
import {Compartment, EditorState, type Extension} from '@codemirror/state'
import {
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  type KeyBinding,
} from '@codemirror/view'
import {groq} from '@sanity/lezer-groq'

/**
 * Holds the undo history, so an editor that shows another document (another tab's query) can
 * drop the history of the one before it, or bring back the one saved for it, by reconfiguring
 * this compartment: a state field only starts over when it is taken out of the configuration
 */
export const historyCompartment = new Compartment()

const sharedExtensions: Extension[] = [
  lineNumbers(),
  highlightActiveLine(),
  highlightActiveLineGutter(),
  highlightSelectionMatches(),
  highlightSpecialChars(),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  historyCompartment.of(history()),
  drawSelection(),
  syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
  keymap.of([
    // Override the default keymap for Mod-Enter to not insert a new line, we have a custom event handler for executing queries
    {key: 'Mod-Enter', run: () => true},

    // Add the default keymap and history keymap
    ...defaultKeymap,
    ...historyKeymap,
  ] as unknown as readonly KeyBinding[]),
]

export const groqExtensions: Extension[] = [groq(), ...sharedExtensions]

export const paramsExtensions: Extension[] = [javascriptLanguage, ...sharedExtensions]

/** A result's JSON: read only, but focusable and selectable, with its objects and arrays foldable */
export const resultJsonExtensions: Extension[] = [
  javascriptLanguage,
  ...sharedExtensions,
  foldGutter(),
  EditorState.readOnly.of(true),
]
