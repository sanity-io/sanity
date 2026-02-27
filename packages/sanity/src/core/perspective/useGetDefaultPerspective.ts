import {LATEST, PUBLISHED} from '../releases/util/const'
import {useWorkspace} from '../studio/workspace'

/**
 * @beta
 * Exposes the default perspective based on the draft model enabled status.
 * If the user hasn't opt out from draft, the default perspective is `drafts`
 * Otherwise, the default perspective is `published`
 * @returns The default perspective based on the draft model enabled status.
 */
export function useGetDefaultPerspective(): 'drafts' | 'published' {
  const isDraftModelEnabled = useWorkspace().document.drafts.enabled
  return isDraftModelEnabled ? LATEST : PUBLISHED
}
