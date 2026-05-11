import {type Path} from '@sanity/types'
import {toString as pathToString} from '@sanity/util/paths'
import {type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {ParseErrorsContext, type SetParseError} from 'sanity/_singletons'

import {type ParseError} from '../../store/utils/mergeParseErrors'

/**
 * Owns transient parse-error state for a document subtree and exposes it via
 * {@link ParseErrorsContext}. Inputs report errors with {@link useReportParseError};
 * consumers (field tooltip, validation panel) read the current map with
 * {@link useParseErrors} and merge it locally with their validation. The state
 * intentionally lives outside the form/validation pipeline so writes never
 * feed back into `useDocumentForm`.
 *
 * @internal
 */
export function ParseErrorsProvider(props: {children: ReactNode}) {
  const [errors, setErrors] = useState<Record<string, ParseError>>({})

  const set = useCallback<SetParseError>((pathKey, value) => {
    setErrors((prev) => {
      if (value === null) {
        if (!(pathKey in prev)) return prev
        const {[pathKey]: _removed, ...rest} = prev
        return rest
      }
      const existing = prev[pathKey]
      if (existing && existing.message === value.message) return prev
      return {...prev, [pathKey]: value}
    })
  }, [])

  const value = useMemo(() => ({errors, set}), [errors, set])

  return <ParseErrorsContext.Provider value={value}>{props.children}</ParseErrorsContext.Provider>
}

/**
 * Returns the current parse-errors map for the surrounding document subtree.
 * Keys are stringified paths produced by `@sanity/util/paths` `toString`.
 *
 * @internal
 */
export function useParseErrors(): Record<string, ParseError> {
  return useContext(ParseErrorsContext).errors
}

/**
 * Returns the parse-error message reported for `path`, if any. Use this from
 * field-level consumers (e.g. `PrimitiveField`) that only care about a single
 * path.
 *
 * @internal
 */
export function useParseErrorForPath(path: Path): string | undefined {
  const pathKey = pathToString(path)
  return useContext(ParseErrorsContext).errors[pathKey]?.message
}

/**
 * Hook for primitive inputs that hold malformed text they cannot commit to the
 * document (e.g. a date input whose value does not match `dateFormat`). The
 * reported error is registered against `path` in the parse-errors context, so
 * consumers (field tooltip, validation panel) can surface it. Pass `null` to
 * clear.
 *
 * Outside a `ParseErrorsProvider` (e.g. in isolated component renders) the
 * hook is a no-op.
 *
 * @internal
 */
export function useReportParseError(path: Path, error: string | null): void {
  const {set} = useContext(ParseErrorsContext)
  const pathKey = pathToString(path)

  // `path` object identity is unstable between renders. We rely on `pathKey`
  // as the effect identity and read the latest `path` via a ref so the effect
  // does not re-run (and thrash state) when only the array reference changes.
  const pathRef = useRef(path)
  pathRef.current = path

  useEffect(() => {
    if (error === null) {
      set(pathKey, null)
      return undefined
    }
    set(pathKey, {path: pathRef.current, message: error})
    return () => set(pathKey, null)
  }, [set, pathKey, error])
}
