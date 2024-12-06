import {isDraftPerspective, isPublishedPerspective} from '../util/util'
import {usePerspective} from './usePerspective'

export const useIsReleaseActive = () => {
  const {selectedPerspective} = usePerspective()

  return (
    !isPublishedPerspective(selectedPerspective) &&
    (isDraftPerspective(selectedPerspective) || selectedPerspective.state === 'active')
  )
}
