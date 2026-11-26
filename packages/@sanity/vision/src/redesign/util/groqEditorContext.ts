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
  /** "Field of post, page": the types that declare a field, in its completion info and hover */
  fieldOf: (types: string) => string
  /** Completions of the fields every document or reference has (`_id`, `_ref`) */
  systemField: string
  /** Completions of document type names, for types without a title */
  documentType: string
  /** Link at the end of an operator's hover documentation */
  operatorReference: string
  /** Under a `$param`'s type in its hover, when the type is its value in the params */
  paramValue: string
  /** Under a `$param`'s type in its hover, when the params give it no value yet */
  paramNotSet: string
  /** Called when a lint suggestion or a library declaration is applied */
  onApplySuggestion?: () => void
  /** Called when a projection is extracted to a function, from its button or the shortcut */
  onExtractFunction?: (via: 'button' | 'shortcut') => void
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

/**
 * The params the query runs with, from the params JSON: the schema checks, completions and hover
 * narrow `_type == $type` by the value of `$type`
 */
export const NO_QUERY_PARAM_VALUES: Readonly<Record<string, unknown>> = Object.freeze({})

export const queryParamValues = Facet.define<
  Readonly<Record<string, unknown>>,
  Readonly<Record<string, unknown>>
>({
  combine: (values) => values[0] ?? NO_QUERY_PARAM_VALUES,
})
