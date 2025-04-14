import {usePerspective} from 'sanity'

import {type PresentationPerspective} from './types'

/**
 * @internal
 */
export function usePresentationPerspective(): PresentationPerspective {
  const {perspectiveStack, selectedPerspectiveName = 'drafts', selectedReleaseId} = usePerspective()
  const perspective = (
    selectedReleaseId ? perspectiveStack : selectedPerspectiveName
  ) as PresentationPerspective
  return perspective
}
