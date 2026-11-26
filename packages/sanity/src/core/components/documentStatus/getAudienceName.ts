import {type TFunction} from '../../i18n/types'
import {getVersionFilterLabel} from '../../variants/plugin/components/getVersionFilterLabel'
import {getVariantId, getVariantTitle} from '../../variants/tool/util'
import {getReleasePerspective} from './getReleasePerspective'
import {
  type DocumentVersionStatusGroup,
  type DocumentVersionStatusItem,
} from './sortDocumentVersionsForStatus'

/**
 * The name of an audience row in the document list's versions tooltip and flyout.
 *
 * With Variants on, the row is an audience: its variant's title, or "Default" for the versions of
 * no variant. With Variants off there are no audiences, so the one row is named after the version
 * it shows, in the Studio's usual words: Published, Draft, or the release's title.
 *
 * @internal
 */
export function getAudienceName({
  group,
  latest,
  t,
  variantsEnabled,
}: {
  group: DocumentVersionStatusGroup
  /** The version the row shows: the group's latest edit. */
  latest: DocumentVersionStatusItem
  t: TFunction
  variantsEnabled: boolean
}): string {
  if (!variantsEnabled) {
    // Agent versions never reach these rows, so no bundles are needed to name them
    return getVersionFilterLabel(
      getReleasePerspective({release: latest.release, version: latest.version}),
      t,
      [],
    ).displayTitle
  }

  if (!group.variantId) return t('document-group.base-variant')

  const variant = group.items[0]?.variant
  return variant ? getVariantTitle(variant) : getVariantId(group.variantId)
}
