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
 * Holds the undo history, so an editor whose view is created again (its tab hidden and shown
 * again) can bring back the history of the one before it: a state field only takes a new initial
 * value when it is taken out of the configuration and put back in
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

/** A result's JSON: read only, but focusable and selectable. Folding is up to the caller. */
export const readOnlyJsonExtensions: Extension[] = [
  javascriptLanguage,
  ...sharedExtensions,
  EditorState.readOnly.of(true),
]
