import {type TFunction} from '../i18n/types'
import {isReleaseDocument} from '../releases/store/types'
import {getReleaseTitleDetails} from '../releases/util/getReleaseTitleDetails'
import {isDraftPerspective, isPublishedPerspective} from '../releases/util/util'
import {isAgentBundleName} from '../store/agent/createAgentBundlesStore'
import {type TargetPerspective} from './types'

/** Copy for the drafts chip. The navbar uses the plural global label. */
type DraftLabelKey = 'release.chip.draft' | 'release.chip.global.drafts'

/**
 * Visible label for a global perspective, plus the uncut title when a release
 * name is truncated.
 *
 * @internal
 */
export interface GlobalPerspectiveLabel {
  displayTitle: string
  fullTitle: string
  isTruncated: boolean
}

function plainLabel(title: string): GlobalPerspectiveLabel {
  return {displayTitle: title, fullTitle: title, isTruncated: false}
}

/**
 * Display copy for the global perspective chip and the version filter.
 * Published, drafts, release titles (truncated), and agent bundles each have
 * their own label. `draftKey` is the only difference between the two chips:
 * the navbar says "Drafts", a document version says "Draft".
 *
 * @internal
 */
export function getGlobalPerspectiveLabel(
  selectedPerspective: TargetPerspective,
  t: TFunction,
  ownBundles: readonly {id: string}[],
  draftKey: DraftLabelKey = 'release.chip.global.drafts',
): GlobalPerspectiveLabel {
  if (isPublishedPerspective(selectedPerspective)) {
    return plainLabel(t('release.chip.published'))
  }

  if (isDraftPerspective(selectedPerspective)) {
    return plainLabel(t(draftKey))
  }

  if (isReleaseDocument(selectedPerspective)) {
    return getReleaseTitleDetails(
      selectedPerspective.metadata?.title,
      t('release.placeholder-untitled-release'),
    )
  }

  if (isAgentBundleName(selectedPerspective)) {
    return plainLabel(
      t(
        ownBundles.some((bundle) => bundle.id === selectedPerspective)
          ? 'version.agent-bundle.proposed-changes'
          : 'version.agent-bundle.agent-changes',
      ),
    )
  }

  return plainLabel(String(selectedPerspective))
}
