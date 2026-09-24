import {usePerspective} from 'sanity'

import {type SupportedPerspective} from '../../perspectives'
import {useOnValueChange} from './useOnValueChange'

/**
 * Follows the studio navbar, as the classic tool does: pinning another release or perspective
 * there switches the tab to the "Pinned release" perspective, so what the user sees in the
 * studio is what the query runs against.
 */
export function useFollowNavbarPerspective(
  perspective: SupportedPerspective | undefined,
  setPerspective: (perspective: SupportedPerspective) => void,
): void {
  const {perspectiveStack} = usePerspective()

  useOnValueChange(perspectiveStack.join(','), () => {
    if (perspectiveStack.length > 0 && perspective !== 'pinnedRelease') {
      setPerspective('pinnedRelease')
    }
  })
}
