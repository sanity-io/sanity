import React, {createContext, ReactNode, useContext, useMemo} from 'react'
import {Path} from '@sanity/types'
import {pathFor} from '@sanity/util/paths'
import {getValueAtPath} from '../../field'
import type {FormDocumentValue} from '../types'

/**
 * @internal
 * @hidden
 */
export interface FormValueContextValue {
  value: FormDocumentValue | undefined
}

const FormValueContext = createContext<FormValueContextValue | null>(null)

/**
 *
 * @internal
 * @hidden
 */
export function FormValueProvider(props: {
  value: FormDocumentValue | undefined
  children: ReactNode
}) {
  const value = useMemo(() => ({value: props.value}), [props.value])
  return <FormValueContext.Provider value={value}>{props.children}</FormValueContext.Provider>
}

/**
 * React hook that returns the value of the field specified by a path.
 * @public
 *
 * @param path - An array notation with segments that are either strings representing field names, index integers for arrays with simple values, or objects with a _key for arrays containing objects
 *
 * @returns The value of the field specified by the path
 *
 * @example Using the `useFormValue` hook
 * ```ts
 * function MyComponent() {
 *    // get value of field 'name' in object 'author'
 *    const authorName = useFormValue(['author', 'name'])
 *    // get value of the second item in array 'tags' of type 'string'
 *    const secondTag = useFormValue(['tags', 1])
 *    // get value of the reference with the matching key in an array of references
 *    const specificBook = useFormValue([ 'bibliography', {_key: '<key>'} ])
 *   // ... do something with the form values ...
 * }
 * ```
 */

export function useFormValue(path: Path): unknown {
  const uniquePath = pathFor(path)
  const ctx = useContext(FormValueContext)
  if (!ctx) {
    throw new Error('useFormValue must be used within a FormValueProvider')
  }

  return getValueAtPath(ctx?.value, uniquePath)
}
