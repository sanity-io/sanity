import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useAgentBundles} from '../../store/agent/useAgentBundles'
import {getGlobalPerspectiveLabel, type GlobalPerspectiveLabel} from '../getGlobalPerspectiveLabel'
import {type TargetPerspective} from '../types'
import {usePerspective} from '../usePerspective'

/**
 * Label for the releases navbar chip. Release titles stay truncated; `fullTitle`
 * is the uncut name for the tooltip.
 *
 * @internal
 */
export function useGlobalPerspectiveLabel(): GlobalPerspectiveLabel & {
  selectedPerspective: TargetPerspective
} {
  const {selectedPerspective} = usePerspective()
  const {bundles} = useAgentBundles()
  const {t} = useTranslation()

  return {
    selectedPerspective,
    ...getGlobalPerspectiveLabel(selectedPerspective, t, bundles),
  }
}
