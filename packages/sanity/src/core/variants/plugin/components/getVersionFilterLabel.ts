import {type TFunction} from '../../../i18n/types'
import {
  getGlobalPerspectiveLabel,
  type GlobalPerspectiveLabel,
} from '../../../perspective/getGlobalPerspectiveLabel'
import {type TargetPerspective} from '../../../perspective/types'

/**
 * Display copy for the version filter pill. Same labels as the navbar chip,
 * except drafts use the singular "Draft".
 *
 * @internal
 */
export function getVersionFilterLabel(
  selectedPerspective: TargetPerspective,
  t: TFunction,
  ownBundles: readonly {id: string}[],
): GlobalPerspectiveLabel {
  return getGlobalPerspectiveLabel(selectedPerspective, t, ownBundles, 'release.chip.draft')
}
