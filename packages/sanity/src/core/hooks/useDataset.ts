import {useSource} from '../studio'

/**
 * React hook that returns the name of the current dataset
 *
 * @public
 * @returns The name of the current dataset
 * @example Using the `useDataset` hook
 * ```ts
 * function MyComponent() {
 *   const dataset = useDataset()
 *   // ... do something with the dataset name ...
 * }
 * ```
 */
export function useDataset(): string {
  return useSource().dataset
}
