import {type TFunction} from '../../../i18n/types'
import {type TargetPerspective} from '../../../perspective/types'
import {isReleaseDocument} from '../../../releases/store/types'
import {getReleaseTitleDetails} from '../../../releases/util/getReleaseTitleDetails'
import {isDraftPerspective, isPublishedPerspective} from '../../../releases/util/util'
import {isAgentBundleName} from '../../../store/agent/createAgentBundlesStore'

/**
 * Display copy for the version filter pill. Mirrors `CurrentGlobalPerspectiveLabel`
 * so agent bundles keep proposed/agent-changes titles and long release names stay truncated.
 *
 * @internal
 */
export function getVersionFilterLabel(
  selectedPerspective: TargetPerspective,
  t: TFunction,
  ownBundles: readonly {id: string}[],
): {displayTitle: string; fullTitle: string; isTruncated: boolean} {
  if (isPublishedPerspective(selectedPerspective)) {
    const title = t('release.chip.published')
    return {displayTitle: title, fullTitle: title, isTruncated: false}
  }

  if (isDraftPerspective(selectedPerspective)) {
    const title = t('release.chip.draft')
    return {displayTitle: title, fullTitle: title, isTruncated: false}
  }

  if (isReleaseDocument(selectedPerspective)) {
    return getReleaseTitleDetails(
      selectedPerspective.metadata?.title,
      t('release.placeholder-untitled-release'),
    )
  }

  if (isAgentBundleName(selectedPerspective)) {
    const title = t(
      ownBundles.some((bundle) => bundle.id === selectedPerspective)
        ? 'version.agent-bundle.proposed-changes'
        : 'version.agent-bundle.agent-changes',
    )
    return {displayTitle: title, fullTitle: title, isTruncated: false}
  }

  const title = String(selectedPerspective)
  return {displayTitle: title, fullTitle: title, isTruncated: false}
}
