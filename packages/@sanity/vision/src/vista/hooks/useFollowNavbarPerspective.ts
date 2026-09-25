import {usePerspective} from 'sanity'

import {type VistaPerspective} from '../store/types'
import {useOnValueChange} from './useOnValueChange'

/**
 * Follows the studio navbar, as the classic tool does: pinning another release or perspective
 * there switches a tab on one of Vision's own perspectives back to the global one, so what the
 * user sees in the studio is what the query runs against. Tabs already on `global` follow by
 * themselves.
 */
export function useFollowNavbarPerspective(
  perspective: VistaPerspective,
  setPerspective: (perspective: VistaPerspective) => void,
): void {
  const {perspectiveStack} = usePerspective()

  useOnValueChange(perspectiveStack.join(','), () => {
    if (perspectiveStack.length > 0 && perspective !== 'global') {
      setPerspective('global')
    }
  })
}
