import {useSource} from '../studio'

/**
 * @beta
 */
export function useProjectId(): string {
  return useSource().projectId
}
