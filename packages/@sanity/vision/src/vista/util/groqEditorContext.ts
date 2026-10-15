import {Facet} from '@codemirror/state'

import {type VistaSavedFunction} from '../store/types'

/**
 * What the query editor's extensions know besides the query: the functions library (for lint,
 * completions and hover documentation of the functions it holds) and the translated labels of
 * the UI those extensions render inside the editor
 */

export interface GroqEditorLabels {
  /** Link to the GROQ functions reference */
  reference: string
  /** "Needs API version v2021-03-25 or later" */
  apiVersion: (version: string) => string
  deltaOnly: string
  /** A custom function, and the line its declaration starts on */
  declaredOn: (line: number) => string
  /** A library function the query does not declare */
  inLibrary: string
  /** Completions of the functions the query declares */
  completionDeclared: string
  /** Completions of the library's functions, which add their declaration */
  completionLibrary: string
  /** The button over a selection that can become a function */
  extract: string
  /** The lint action that declares a library function the query calls */
  addFromLibrary: string
}

const NO_FUNCTIONS: readonly VistaSavedFunction[] = []

export const functionLibrary = Facet.define<
  readonly VistaSavedFunction[],
  readonly VistaSavedFunction[]
>({
  combine: (values) => values[0] ?? NO_FUNCTIONS,
})

export const groqEditorLabels = Facet.define<GroqEditorLabels, GroqEditorLabels | undefined>({
  combine: (values) => values[0],
})
