import {Schema} from '@sanity/types'
import {useSource} from '../studio'

/**
 * React hook that returns the schema registry for the current project
 *
 * @public
 * @returns The schema registry for the current project
 * @example Using the `useSchema` hook
 * ```ts
 * function MyComponent() {
 *   const schema = useSchema()
 *   // ... do something with the schema ...
 * }
 * ```
 */
export function useSchema(): Schema {
  return useSource().schema
}
