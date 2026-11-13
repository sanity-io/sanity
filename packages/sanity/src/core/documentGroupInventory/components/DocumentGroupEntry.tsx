import {type ReleaseDocument} from '@sanity/client'
import {type KeyboardEvent, type MouseEventHandler, type ReactNode, type Ref, useId} from 'react'
import {Icon, Text} from 'ui5'

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
import {LeadingGlyph} from './VariantSet/LeadingGlyph'
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
  showStatusBadges = false,
  leading,
  onPrimaryAction,
  onToggleSelection,
  selectionBlockedReason,
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
  /** Whether this is the version open in the form. Its row is marked as the current item. */
  isSelected?: boolean
  servedStatus?: ServedStatus
  /**
   * Whether to show the Editing and Served badges. Off for the Open Beta, until the decision on
   * status labels; the open version's row is marked as the current item instead.
   */
  showStatusBadges?: boolean
  /** The selection checkbox. Omitted where versions can never be selected, as in the picker. */
  leading?: ReactNode
  /** Opens the version. Clicking the row, or Enter on it, does this; only the checkbox selects. */
  onPrimaryAction: () => void
  /** Toggles the row's selection. Space on the focused row does this, as on the checkbox itself. */
  onToggleSelection?: () => void
  /**
   * Why the row cannot be selected. Its checkbox shows it as a tooltip; the row, which is the tab
   * stop, carries it as its description so keyboard and screen reader users get it too.
   */
  selectionBlockedReason?: string
  onContextMenu?: MouseEventHandler<HTMLButtonElement>
  primaryActionRef?: Ref<HTMLButtonElement>
}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const {document} = variant
  const release = resolveVariantRelease(variant, releases)
  const isVariantRow = getDocumentVersionVariantId(document) !== undefined
  const descriptionId = useId()
  const servedTone = servedStatus === 'primary' ? 'positive' : 'suggest'
  const showServed = showStatusBadges && servedStatus !== undefined
  const servedDescription = showServed ? t('document-group.version.served.tooltip') : undefined
  const hasDescription = Boolean(servedDescription || selectionBlockedReason)
  const neverPublished =
    !release && documentVersions !== undefined && isNeverPublishedDraft(document, documentVersions)

  return (
    <VariantSetEntry
      data-variant-name={variant.name}
      data-selected={isSelected || undefined}
      data-current={isSelected || undefined}
      data-served={servedStatus}
    >
      {leading !== undefined && <div className="atom">{leading}</div>}
      {/* The glyph's box is trimmed to the glyph, like an icon beside text anywhere else */}
      <LeadingGlyph
        className="variant-mark"
        data-testid={isVariantRow ? 'variant-mark' : undefined}
      >
        {isVariantRow && (
          <Icon icon={RhombusIconLarge} size={1} aria-hidden style={{margin: '-0.375rem'}} />
        )}
      </LeadingGlyph>
      <div className="row-content">
        <button
          type="button"
          className="primary-action"
          ref={primaryActionRef}
          onClick={onPrimaryAction}
          onKeyDown={
            onToggleSelection ? (event) => handleSpace(event, onToggleSelection) : undefined
          }
          onKeyUp={onToggleSelection ? preventSpaceActivation : undefined}
          aria-keyshortcuts={onToggleSelection ? 'Space' : undefined}
          // The row's tab stop, so it carries the row's current-item state
          aria-current={isSelected ? 'true' : undefined}
          aria-describedby={hasDescription ? descriptionId : undefined}
          onContextMenu={onContextMenu}
        >
          {variant.name}
        </button>
        {hasDescription && (
          // The tooltips on the Served badge and the blocked checkbox only open on pointer hover,
          // so their text is also the row's description, read when the row takes focus.
          <span id={descriptionId} hidden>
            {[servedDescription, selectionBlockedReason].filter(Boolean).join(' ')}
          </span>
        )}
        {/*
         * The text and the badges share one wrapping body, so a badge group that does not fit
         * beside the text drops to its own line under it, starting where the text starts.
         */}
        <div className="version-body">
          <div className="version-lines" data-testid="version-lines">
            <div className="version-title">
              <Text
                size={1}
                weight={isSelected ? 'semibold' : 'medium'}
                trim={true}
                data-testid="version-title"
              >
                {variant.name}
              </Text>
            </div>
            <div className="version-secondary">
              <Text muted size={1} as="div" trim={true} data-testid="version-secondary-line">
                {release ? (
                  <ReleaseDateLine release={release} />
                ) : (
                  <EditedLine neverPublished={neverPublished} version={document} />
                )}
              </Text>
            </div>
          </div>
          {showStatusBadges && (isSelected || showServed) && (
            // One group, in a fixed order: Editing, Served, then the rest.
            <div className="version-badges" data-testid="version-badges">
              {isSelected && (
                <StatusBadge radius={2} tone="primary" data-badge="editing">
                  {t('document-group-inventory.viewing-item-label')}
                </StatusBadge>
              )}
              {showServed && (
                <Tooltip content={t('document-group.version.served.tooltip')}>
                  <StatusBadge radius={2} tone={servedTone} data-badge="served">
                    {servedStatus === 'primary'
                      ? t('document-group.version.served')
                      : t('document-group.version.served-instead')}
                  </StatusBadge>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>
    </VariantSetEntry>
  )
}

/**
 * Space on a focused row toggles its checkbox rather than activating the row's primary action,
 * the way Space toggles a focused checkbox. Enter still opens the version.
 */
function handleSpace(event: KeyboardEvent<HTMLButtonElement>, onToggleSelection: () => void) {
  if (event.key !== ' ') return
  event.preventDefault()
  if (!event.repeat) onToggleSelection()
}

/** A button activates on Space's keyup, so that has to be stopped too. */
function preventSpaceActivation(event: KeyboardEvent<HTMLButtonElement>) {
  if (event.key === ' ') event.preventDefault()
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
