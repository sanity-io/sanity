import {createContext} from 'sanity/_createContext'

import type {ParseError} from '../../core/form/store/utils/mergeParseErrors'

/**
 * Shape of the context exposed to consumers of parse errors. Inputs use the
 * `set` setter via `useReportParseError` to register/clear a transient parse
 * error keyed by `@sanity/util/paths` `toString(path)`. Consumers (field
 * tooltip, validation panel) read the `errors` map and merge it locally with
 * their validation values.
 *
 * @internal
 */
export interface ParseErrorsContextValue {
  errors: Record<string, ParseError>
  set: (pathKey: string, value: ParseError | null) => void
}

/**
 * Legacy alias kept for back-compat with the existing setter type used by
 * input components.
 *
 * @internal
 */
export type SetParseError = ParseErrorsContextValue['set']

const NOOP_SET: SetParseError = () => undefined

/**
 * @internal
 */
export const PARSE_ERRORS_DEFAULT: ParseErrorsContextValue = {
  errors: {},
  set: NOOP_SET,
}

/**
 * @internal
 */
export const ParseErrorsContext = createContext<ParseErrorsContextValue>(
  'sanity/_singletons/context/parse-errors',
  PARSE_ERRORS_DEFAULT,
)
