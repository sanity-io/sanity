import {Facet} from '@codemirror/state'

import {type VisionSavedFunction} from '../store/types'
import {type QuerySchema} from './schemaCheck'

/**
 * What the query editor's extensions know besides the query: the functions library (for lint,
 * completions and hover documentation of the functions it holds), the workspace schema the
 * query is checked against, and the translated labels of the UI those extensions render inside
 * the editor
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
  /** The lint action that writes the name a schema finding suggests */
  useSuggestion: (suggestion: string) => string
}

const NO_FUNCTIONS: readonly VisionSavedFunction[] = []

export const functionLibrary = Facet.define<
  readonly VisionSavedFunction[],
  readonly VisionSavedFunction[]
>({
  combine: (values) => values[0] ?? NO_FUNCTIONS,
})

export const groqEditorLabels = Facet.define<GroqEditorLabels, GroqEditorLabels | undefined>({
  combine: (values) => values[0],
})

/** The workspace schema the query is checked against; none when the studio has no schema */
export const querySchema = Facet.define<QuerySchema, QuerySchema | undefined>({
  combine: (values) => values[0],
})
