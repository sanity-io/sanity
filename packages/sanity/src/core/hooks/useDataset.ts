import {useSource} from '../studio/source'

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
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  return useSource().dataset
}
