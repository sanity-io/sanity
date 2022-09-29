import {useSource} from '../studio'

/**
 * @beta
 */
export function useDataset(): string {
  return useSource().dataset
}
