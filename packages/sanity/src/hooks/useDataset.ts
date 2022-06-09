import {useSource} from '../studio'

/**
 * @public
 */
export function useDataset(): string {
  return useSource().dataset
}
