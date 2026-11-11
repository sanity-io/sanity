import {type ReleaseDocument} from '@sanity/client'
import {type MouseEventHandler, type ReactNode, type Ref} from 'react'
import {Flex, Text} from 'ui5'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {getDocumentVersionStatusTimestampKey} from '../../components/documentStatus/getDocumentVersionStatusTimestampKey'
import {RhombusIconLarge} from '../../components/temporary-icons/Rhombus'
import {useCompactTimeAgo} from '../../hooks/useRelativeTime'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {useFormatRelativeLocalePublishDate} from '../../releases/hooks/useFormatRelativeLocalePublishDate'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {getDocumentVersionVariantId} from '../../util/getDocumentVersionVariant'
import {type Variant} from '../machines/selectionMachine'
import {isNeverPublishedDraft} from '../utils/isNeverPublishedDraft'
import {type ServedStatus} from '../utils/resolveServedVersion'
import {StatusBadge} from './VariantSet/StatusBadge'
import {VariantSetEntry} from './VariantSet/VariantSetEntry'

/**
 * Shared row chrome for a document group version.
 *
 * @internal
 */
export function DocumentGroupEntry({
  variant,
  releases,
  documentVersions,
  isSelected,
  servedStatus,
  leading,
  onPrimaryAction,
  onContextMenu,
  primaryActionRef,
}: {
  variant: Variant
  releases: Map<string, ReleaseDocument>
  /**
   * Every version in the document group. The second line compares a draft row with its siblings,
   * to say when the draft's own copy has never been published.
   */
  documentVersions?: VersionInfoDocumentStub[]
  isSelected?: boolean
  servedStatus?: ServedStatus
  leading?: ReactNode
  onPrimaryAction: () => void
  onContextMenu?: MouseEventHandler<HTMLButtonElement>
  primaryActionRef?: Ref<HTMLButtonElement>
}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const {document} = variant
  const release = resolveVariantRelease(variant, releases)
  const isVariantRow = getDocumentVersionVariantId(document) !== undefined
  const neverPublished =
    !release && documentVersions !== undefined && isNeverPublishedDraft(document, documentVersions)

  return (
    <VariantSetEntry
      data-variant-name={variant.name}
      data-selected={isSelected || undefined}
      data-served={servedStatus}
    >
      <div className="atom">{leading}</div>
      <div className="atom">
        <div className="atom">
          <button
            type="button"
            className="primary-action"
            ref={primaryActionRef}
            onClick={onPrimaryAction}
            onContextMenu={onContextMenu}
          >
            {variant.name}
          </button>
          <span className="variant-mark" data-testid={isVariantRow ? 'variant-mark' : undefined}>
            {isVariantRow && <RhombusIconLarge aria-hidden />}
          </span>
          <Flex flexDirection="column" gap={2}>
            <Text size={1} weight="medium" trim={true}>
              {variant.name}
            </Text>
            <Text muted size={1} as="div" trim={true} data-testid="version-secondary-line">
              {release ? (
                <ReleaseDateLine release={release} />
              ) : (
                <EditedLine neverPublished={neverPublished} version={document} />
              )}
            </Text>
          </Flex>
        </div>
        <div className="atom">
          {isSelected && (
            <StatusBadge radius={2} tone="primary">
              {t('document-group-inventory.viewing-item-label')}
            </StatusBadge>
          )}
          {servedStatus && (
            <Tooltip content={t('document-group.version.served.tooltip')}>
              <StatusBadge radius={2} tone={servedStatus === 'primary' ? 'positive' : 'suggest'}>
                {servedStatus === 'primary'
                  ? t('document-group.version.served')
                  : t('document-group.version.served-instead')}
              </StatusBadge>
            </Tooltip>
          )}
        </div>
      </div>
    </VariantSetEntry>
  )
}

/**
 * When the version's release goes out, in the words the version context menu uses for it.
 */
function ReleaseDateLine({release}: {release: ReleaseDocument}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const formatPublishDate = useFormatRelativeLocalePublishDate()

  switch (release.metadata.releaseType) {
    case 'asap':
      return t('release.type.asap')
    case 'undecided':
      return t('release.type.undecided')
    default:
      // A scheduled release always has a date; the fallback only covers data that lacks one.
      return release.metadata.intendedPublishAt || release.publishAt
        ? formatPublishDate(release)
        : t('release.chip.tooltip.unknown-date')
  }
}

/**
 * When the version was last edited, in the words of the document list's versions popover:
 * "Edited 3 hr ago", or "Published 2 wk ago" for the published version. A draft whose own copy has
 * never been published says so after it: "Edited 3 hr ago · not published yet".
 */
function EditedLine({
  neverPublished,
  version,
}: {
  neverPublished: boolean
  version: VersionInfoDocumentStub
}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const schema = useSchema()
  const liveEdit = Boolean(schema.get(version._type)?.liveEdit)
  const timeAgo = useCompactTimeAgo(version._updatedAt)
  const status = t(getDocumentVersionStatusTimestampKey(version, liveEdit), {date: timeAgo})

  return neverPublished ? t('document-group.version.not-published-yet', {status}) : status
}

/**
 * Resolves the release document for a version, preferring the release attached
 * when the set was computed and falling back to the active-releases map.
 *
 * @internal
 */
export function resolveVariantRelease(
  variant: Variant,
  releases: Map<string, ReleaseDocument>,
): ReleaseDocument | undefined {
  const releaseRef = variant.document._system.release?._ref
  return variant.releaseDocument ?? (releaseRef ? releases.get(releaseRef) : undefined)
}
