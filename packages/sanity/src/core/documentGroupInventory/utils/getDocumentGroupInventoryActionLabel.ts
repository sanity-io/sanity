import {type TFunction} from '../../i18n/types'
import {type TargetPerspective} from '../../perspective/types'
import {isDraftPerspective, isPublishedPerspective} from '../../releases/util/util'
import {isAgentBundleName} from '../../store/agent/createAgentBundlesStore'
import {getVariantTitle} from '../../variants/tool/util'
import {type SystemVariant} from '../../variants/types'

/**
 * Label for the document group inventory footer action.
 *
 * Release documents show their release title. Variant-scoped documents (whose
 * version id is a scope id, not a release) fall back from `useVersionRelease` to
 * that raw id string — those must show the variant title instead.
 *
 * @internal
 */
export function getDocumentGroupInventoryActionLabel({
  perspective,
  variant,
  t,
}: {
  perspective: TargetPerspective | undefined
  variant: SystemVariant | undefined
  t: TFunction
}): string {
  if (typeof perspective === 'undefined') {
    return ''
  }

  if (isAgentBundleName(perspective)) {
    return t('version.agent-bundle.proposed-changes')
  }

  if (isDraftPerspective(perspective)) {
    return 'Draft'
  }

  if (isPublishedPerspective(perspective)) {
    return 'Published'
  }

  if (typeof perspective === 'string') {
    // Anonymous / variant scope ids are not releases. Prefer the variant title
    // (matches the selected variant shown in the studio navbar).
    if (variant) {
      return getVariantTitle(variant)
    }

    return perspective
  }

  return perspective.metadata.title ?? perspective._id
}
