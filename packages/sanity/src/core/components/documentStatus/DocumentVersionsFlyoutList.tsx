import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {type ReactNode, type SVGProps} from 'react'
import {Icon, Text} from 'ui5'

import {useCompactTimeAgo} from '../../hooks/useRelativeTime'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
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

/**
 * The `versions` glyph of the Studio Patterns library (three offset cards, a stack seen from the
 * side), drawn on the 25px grid every `@sanity/icons` icon uses.
 */
function VersionsGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      data-sanity-icon="versions"
      fill="none"
      height="1em"
      viewBox="0 0 25 25"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        clipRule="evenodd"
        d="M17.221 4.11719C17.4994 4.11719 17.7247 4.34251 17.7247 4.62086V16.3809C17.7247 16.6592 17.4994 16.8845 17.221 16.8845H8.82102C8.54266 16.8845 8.31734 16.6592 8.31734 16.3809V15.2045H6.30102C6.02266 15.2045 5.79734 14.9792 5.79734 14.7009V13.5245H3.78102C3.50266 13.5245 3.27734 13.2992 3.27734 13.0209V7.98086C3.27734 7.70251 3.50266 7.47719 3.78102 7.47719H5.79734V6.30086C5.79734 6.02251 6.02266 5.79719 6.30102 5.79719H8.31734V4.62086C8.31734 4.34251 8.54266 4.11719 8.82102 4.11719H17.221ZM9.32469 15.8772H16.7173V5.12453H9.32469V15.8772ZM6.80469 14.1972H8.31734V6.80453H6.80469V14.1972ZM4.28469 12.5172H5.79734V8.48453H4.28469V12.5172Z"
        fill="currentColor"
        fillRule="evenodd"
        transform="scale(1.190476)"
      />
    </svg>
  )
}

function FlyoutRow(props: {
  testId: string
  title: string
  subtitle?: string
  media?: ReactNode
  trailing?: ReactNode
  onClick: () => void
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
      tabIndex={-1}
      tone="inherit"
      type="button"
    >
      <div className={rowContent}>
        {props.media ? <div className={media}>{props.media}</div> : null}
        <div className={text}>
          <Text size={1} truncate={1}>
            {props.title}
          </Text>
          {props.subtitle ? (
            <Text muted size={1} truncate={1}>
              {props.subtitle}
            </Text>
          ) : null}
        </div>
        {props.trailing}
      </div>
    </PreviewCard>
  )
}

function AudienceRow({group, onClick}: {group: DocumentVersionStatusGroup; onClick: () => void}) {
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
}) {
  const {documentGroupId, onOpenInventory, onPick} = props
  const {t} = useTranslation()
  const {groups, loading} = useDocumentVersionStatusGroups(documentGroupId)

  if (loading) return null

  const total = groups.reduce((count, group) => count + group.items.length, 0)

  return (
    <div
      aria-label={t('document-group.flyout.title')}
      className={root}
      data-testid="document-versions-flyout"
      role="menu"
    >
      {groups.slice(0, MAX_AUDIENCES).map((group) => (
        <AudienceRow
          group={group}
          key={group.variantId ?? 'default'}
          onClick={() => onPick(group.variantId ?? null)}
        />
      ))}
      <FlyoutRow
        media={
          <Text size={2}>
            <VersionsGlyph />
          </Text>
        }
        onClick={onOpenInventory}
        testId="document-versions-flyout-inventory"
        title={t('document-group.flyout.see-all', {count: total})}
        trailing={<Icon icon={ChevronRightIcon} size={1} />}
      />
    </div>
  )
}
