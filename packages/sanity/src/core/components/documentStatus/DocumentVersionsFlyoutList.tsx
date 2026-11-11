import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {Card} from '@sanity/ui'
import {type CSSProperties, type ReactNode} from 'react'
import {Flex, Icon, Text} from 'ui5'

import {useCompactTimeAgo} from '../../hooks/useRelativeTime'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {getDefaultVariant} from '../../perspective/getDefaultVariant'
import {usePerspective} from '../../perspective/usePerspective'
import {readVersionType} from '../../util/versionsUtils'
import {getVariantId, getVariantTitle} from '../../variants/tool/util'
import {PreviewCard} from '../previewCard/PreviewCard'
import {RhombusIcon} from '../temporary-icons/Rhombus'
import {
  name as nameClass,
  root,
  subtitleIndent,
  variantMark,
} from './DocumentVersionsFlyoutList.css'
import {latestEdit, useDocumentVersionStatusGroups} from './DocumentVersionsStatus'
import {getDocumentVersionStatusTimestampKey} from './getDocumentVersionStatusTimestampKey'
import {type DocumentVersionStatusGroup} from './sortDocumentVersionsForStatus'

/** Audiences the flyout lists before its last row. */
const MAX_AUDIENCES = 5

function FlyoutRow(props: {
  testId: string
  title: ReactNode
  subtitle?: string
  subtitleIndent?: boolean
  media?: ReactNode
  trailing?: ReactNode
  onClick: () => void
  selected?: boolean
}) {
  return (
    <PreviewCard
      __unstable_focusRing
      as="button"
      data-testid={props.testId}
      onClick={props.onClick}
      radius={2}
      role="menuitem"
      selected={props.selected}
      sizing="border"
      style={{display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer'}}
      tabIndex={-1}
      tone="inherit"
      type="button"
    >
      {/* The same box as a document list row (`DefaultPreview`): 8px padding, a 33px media slot, a title and a muted subtitle 8px apart, both trimmed. */}
      <Flex alignItems="center" padding={2} paddingLeft={props.media ? 2 : 3}>
        <Flex alignItems="center" flexBasis="0%" flexGrow={1} gap={2} style={{minHeight: 33}}>
          {props.media ? (
            <Flex
              alignItems="center"
              flexBasis="auto"
              flexGrow={0}
              flexShrink={0}
              justifyContent="center"
              style={{width: 33, height: 33}}
            >
              {props.media}
            </Flex>
          ) : null}
          <Flex flexBasis="0%" flexDirection="column" flexGrow={1} gap={2} style={{minWidth: 0}}>
            {props.title}
            {props.subtitle ? (
              <div className={props.subtitleIndent ? subtitleIndent : undefined}>
                <Text
                  as="div"
                  muted
                  size={1}
                  style={{color: 'var(--card-muted-fg-color)'}}
                  trim
                  truncate={1}
                >
                  {props.subtitle}
                </Text>
              </div>
            ) : null}
          </Flex>
          {props.trailing}
        </Flex>
      </Flex>
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

  // A draft that was never published says so in words, since the row carries no status icons.
  const neverPublished =
    group.items.some((item) => readVersionType(item.version) === 'draft') &&
    !group.items.some((item) => readVersionType(item.version) === 'published')
  const subtitle = neverPublished
    ? t('document-group.version.not-published-yet', {
        status: t('document-status.edited', {date: timeAgo}),
      })
    : t(getDocumentVersionStatusTimestampKey(version, liveEdit), {date: timeAgo})

  return (
    <FlyoutRow
      onClick={onClick}
      selected={selected}
      subtitle={subtitle}
      subtitleIndent
      testId="document-versions-flyout-row"
      title={
        <div className={nameClass}>
          <span aria-hidden className={variantMark}>
            {group.variantId ? (
              <Icon
                icon={RhombusIcon}
                size={1}
                style={
                  {
                    '--icon-color': selected
                      ? 'var(--card-fg-color)'
                      : 'var(--card-badge-suggest-dot-color)',
                  } as CSSProperties
                }
              />
            ) : null}
          </span>
          <Text as="div" size={1} style={{color: 'inherit'}} trim truncate={1} weight="medium">
            {name}
          </Text>
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
 * event as the subtitle and a diamond before the audiences' names, and a last row that opens the document group
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
          title={
            <Text as="div" size={1} style={{color: 'inherit'}} trim truncate={1} weight="medium">
              {t('document-group.flyout.see-all', {count: total})}
            </Text>
          }
          trailing={<Icon icon={ChevronRightIcon} size={1} />}
        />
      </div>
    </Card>
  )
}
