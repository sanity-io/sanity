import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {Card, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Icon} from 'ui5'

import {useCompactTimeAgo} from '../../hooks/useRelativeTime'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {getDefaultVariant} from '../../perspective/getDefaultVariant'
import {usePerspective} from '../../perspective/usePerspective'
import {readVersionType} from '../../util/versionsUtils'
import {getVariantId, getVariantTitle} from '../../variants/tool/util'
import {DocumentStatusIcon} from '../documentStatusIndicator/DocumentVersionsStatusIndicator'
import {PreviewCard} from '../previewCard/PreviewCard'
import {dots, media, root, row, rowContent, text} from './DocumentVersionsFlyoutList.css'
import {latestEdit, useDocumentVersionStatusGroups} from './DocumentVersionsStatus'
import {getDocumentVersionStatusTimestampKey} from './getDocumentVersionStatusTimestampKey'
import {type DocumentVersionStatusGroup} from './sortDocumentVersionsForStatus'

/** Audiences the flyout lists before its last row. */
const MAX_AUDIENCES = 5

/** The order of the status dots of a row, which keeps published at the right edge. */
const ICON_KINDS = ['release', 'draft', 'published'] as const

function FlyoutRow(props: {
  testId: string
  title: string
  subtitle?: string
  media?: ReactNode
  trailing?: ReactNode
  onClick: () => void
  selected?: boolean
}) {
  return (
    <PreviewCard
      __unstable_focusRing
      as="button"
      className={row}
      data-testid={props.testId}
      onClick={props.onClick}
      radius={2}
      role="menuitem"
      selected={props.selected}
      sizing="border"
      tabIndex={-1}
      tone="inherit"
      type="button"
    >
      <div className={rowContent}>
        {props.media ? <div className={media}>{props.media}</div> : null}
        <div className={text}>
          <Text size={1} textOverflow="ellipsis">
            {props.title}
          </Text>
          {props.subtitle ? (
            <Text muted size={1} textOverflow="ellipsis">
              {props.subtitle}
            </Text>
          ) : null}
        </div>
        {props.trailing}
      </div>
    </PreviewCard>
  )
}

function AudienceRow({
  group,
  onClick,
  selected,
}: {
  group: DocumentVersionStatusGroup
  onClick: () => void
  selected: boolean
}) {
  const {t} = useTranslation()
  const schema = useSchema()
  const {version} = latestEdit(group)
  const liveEdit = Boolean(schema.get(version._type)?.liveEdit)
  const timeAgo = useCompactTimeAgo(version._updatedAt)
  const variant = group.items[0]?.variant
  let name = t('document-group.base-variant')
  if (group.variantId) {
    name = variant ? getVariantTitle(variant) : getVariantId(group.variantId)
  }

  return (
    <FlyoutRow
      onClick={onClick}
      selected={selected}
      subtitle={t(getDocumentVersionStatusTimestampKey(version, liveEdit), {date: timeAgo})}
      testId="document-versions-flyout-row"
      title={name}
      trailing={
        <div className={dots}>
          {ICON_KINDS.map((kind) => {
            const item = group.items.find(
              (candidate) => readVersionType(candidate.version) === kind,
            )
            return item ? (
              <DocumentStatusIcon key={kind} kind={kind} release={item.release} />
            ) : null
          })}
        </div>
      }
    />
  )
}

/**
 * Whether a document has versions beyond its base, which is when its list row gets a flyout: a
 * version for an audience, or one in a release.
 *
 * @internal
 */
export function useHasVersionsBeyondBase(documentGroupId: string): boolean {
  const {groups} = useDocumentVersionStatusGroups(documentGroupId)
  return groups.some(
    (group) =>
      Boolean(group.variantId) ||
      group.items.some((item) => readVersionType(item.version) === 'release'),
  )
}

/**
 * The content of the versions flyout on a document list row: one row per audience, with its latest
 * event as the subtitle and its versions as dots, and a last row that opens the document group
 * inventory. Rows are menu items, so the host can move focus between them with the arrow keys.
 *
 * @internal
 */
export function DocumentVersionsFlyoutList(props: {
  documentGroupId: string
  /** Called with the audience of the row that was picked (`null` for the default one). */
  onPick: (variantId: string | null) => void
  onOpenInventory: () => void
  /** Whether the document of this row is the one open in the pane, which marks the version it shows. */
  viewingDocument?: boolean
}) {
  const {documentGroupId, onOpenInventory, onPick, viewingDocument = false} = props
  const {selectedVariantNames} = usePerspective()
  const viewedVariantId = getDefaultVariant(selectedVariantNames)
  const {t} = useTranslation()
  const {groups, loading} = useDocumentVersionStatusGroups(documentGroupId)

  if (loading) return null

  const total = groups.reduce((count, group) => count + group.items.length, 0)

  return (
    <Card
      aria-label={t('document-group.flyout.title')}
      border
      data-testid="document-versions-flyout"
      radius={2}
      role="menu"
      // Flush with the list: square corners on the side that touches the pane.
      style={{borderTopLeftRadius: 0, borderBottomLeftRadius: 0, overflow: 'hidden'}}
    >
      <div className={root}>
        {groups.slice(0, MAX_AUDIENCES).map((group) => (
          <AudienceRow
            group={group}
            key={group.variantId ?? 'default'}
            onClick={() => onPick(group.variantId ?? null)}
            selected={viewingDocument && (group.variantId ?? undefined) === viewedVariantId}
          />
        ))}
        <FlyoutRow
          media={<Icon icon={DocumentsIcon} size={2} />}
          onClick={onOpenInventory}
          testId="document-versions-flyout-inventory"
          title={t('document-group.flyout.see-all', {count: total})}
          trailing={<Icon icon={ChevronRightIcon} size={1} />}
        />
      </div>
    </Card>
  )
}
