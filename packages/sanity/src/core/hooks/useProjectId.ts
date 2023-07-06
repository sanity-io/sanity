import {useSource} from '../studio'

/**
 * React hook that returns the current project id
 *
 * @public
 * @returns The current project id
 * @example Using the `useProjectId` hook
 * ```ts
 * function MyComponent() {
 *   const projectId = useProjectId()
 *   // ... do something with the project id ...
 * }
 * ```
 */
export function useProjectId(): string {
  return useSource().projectId
}
