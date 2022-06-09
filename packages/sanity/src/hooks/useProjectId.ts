import {useSource} from '../studio'

/**
 * @public
 */
export function useProjectId(): string {
  return useSource().projectId
}
