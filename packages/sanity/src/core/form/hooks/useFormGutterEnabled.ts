import {useWorkspace} from '../../studio/workspace'
import {useDocumentDivergences} from '../contexts/DivergencesProvider'

/**
 * @internal
 */
export function useFormGutterEnabled(): boolean {
  const workspace = useWorkspace()
  const {enabled: divergencesEnabled} = useDocumentDivergences()

  return divergencesEnabled || workspace.beta?.variants?.enabled === true
}
