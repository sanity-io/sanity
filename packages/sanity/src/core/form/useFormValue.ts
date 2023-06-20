import {Path} from '@sanity/types'
import {getValueAtPath} from '../field'
import {useUnique} from '../util'
import {useFormBuilder} from './useFormBuilder'

/**
 * React hook that returns the value of the field specified by a path.
 * @public
 * @param path - An array notation with segments that are either strings representing field names, index integers for arrays with simple values, or objects with a _key for arrays containing objects
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
  const uniquePath = useUnique(path)
  const {value} = useFormBuilder()

  return getValueAtPath(value, uniquePath)
}
