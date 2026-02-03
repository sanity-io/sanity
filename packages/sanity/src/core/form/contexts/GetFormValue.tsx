import {type Path} from '@sanity/types'
import {type ReactNode, useCallback, useContext, useEffect, useRef} from 'react'
import {GetFormValueContext} from 'sanity/_singletons'

import {getValueAtPath} from '../../field'
import {type FormDocumentValue} from '../types'

/**
 *
 * @internal
 * @hidden
 */
export const GetFormValueProvider = function GetFormValueProvider(props: {
  value: FormDocumentValue | undefined
  children: ReactNode
}) {
  const valueRef = useRef(props.value)
  useEffect(() => {
    valueRef.current = props.value
  }, [props.value])

  const getValue = useCallback((path: Path) => getValueAtPath(valueRef.current, path), [valueRef])
  return (
    <GetFormValueContext.Provider value={getValue}>{props.children}</GetFormValueContext.Provider>
  )
}
GetFormValueProvider.displayName = 'GetFormValueProvider'

/**
 * React hook that returns a function that can be called to look up the value from the current document at the given path.
 * The returned function is stable and never changes identity.
 * NOTE: This hook will *not* trigger a re-render when the value of the document changes, which makes it less suitable for use in render functions.
 * The main use case for using this is to look up values at the current document during an event handler
 * @public
 *
 * @returns A function that can be called to look up the value from the current document at the given path.
 *
 * @example Using the `useGetFormValue` hook
 * ```ts
 * function MyComponent() {
 *    // get value of field 'name' in object 'author'
 *    const getFormValue = useGetFormValue()
 *
 *    const handleClick = useCallback(() => {
 *      console.log(getFormValue(['author', 'name']))
 *    }, [getFormValue])
 * }
 * ```
 */

export function useGetFormValue() {
  const ctx = useContext(GetFormValueContext)
  if (!ctx) {
    throw new Error('useGetFormValue must be used within a GetFormValueProvider')
  }
  return ctx
}
