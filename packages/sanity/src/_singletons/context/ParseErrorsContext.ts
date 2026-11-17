import {createContext} from 'react'

import type {ParseError} from '../../core/form/store/utils/mergeParseErrors'

/**
 * Setter passed to inputs via `useReportParseError`. Inputs register a
 * transient parse error keyed by `@sanity/util/paths` `toString(path)`, or
 * clear it by passing `null`.
 *
 * @internal
 */
export type SetParseError = (pathKey: string, value: ParseError | null) => void

interface ParseErrorsContextValue {
  errors: Record<string, ParseError>
  set: SetParseError
}

/**
 * @internal
 */
export const ParseErrorsContext = createContext<ParseErrorsContextValue>({
  errors: {},
  set: () => undefined,
})
