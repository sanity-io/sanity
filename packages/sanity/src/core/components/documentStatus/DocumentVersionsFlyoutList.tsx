import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {Card} from '@sanity/ui'
import {type CSSProperties, type ReactNode, useState} from 'react'
import {Flex, Icon, Text} from 'ui5'

import {useCompactTimeAgo} from '../../hooks/useRelativeTime'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {getDefaultVariant} from '../../perspective/getDefaultVariant'
import {usePerspective} from '../../perspective/usePerspective'
import {readVersionType} from '../../util/versionsUtils'
import {getVariantId, getVariantTitle} from '../../variants/tool/util'
import {PreviewCard} from '../previewCard/PreviewCard'
import {RhombusIconLarge} from '../temporary-icons/Rhombus'
import {root} from './DocumentVersionsFlyoutList.css'
import {latestEdit, useDocumentVersionStatusGroups} from './DocumentVersionsStatus'
import {getDocumentVersionStatusTimestampKey} from './getDocumentVersionStatusTimestampKey'
import {type DocumentVersionStatusGroup} from './sortDocumentVersionsForStatus'

/** Audiences the flyout lists before its last row. */
const MAX_AUDIENCES = 5

/** The trailing column of status marks: as wide on every row, so the marks line up at the right edge. */
const MARK_COLUMN_WIDTH = 25

/** ui5 icons declare their own colour variable, so on the active row it is set on the icon itself. */
function activeIconStyle(active: boolean): CSSProperties | undefined {
  return active ? ({'--icon-color': 'var(--card-fg-color)'} as CSSProperties) : undefined
}

function FlyoutRow(props: {
  testId: string
  title: ReactNode
  subtitle?: string
  renderMedia?: (active: boolean) => ReactNode
  /**
   * The row's status marks (the variant diamond), in a column at the right edge that is as wide on
   * every row, so the marks line up like the document list's and the inventory's. Rows without a
   * mark keep the empty column.
   */
  renderTrailing?: (active: boolean) => ReactNode
  onClick: () => void
  /** The version the pane is viewing: the list's selected-but-inactive tint, until the row is hovered or focused. */
  viewed?: boolean
}) {
  // Hover and keyboard focus are the menus' active state: the selected fill and text colours.
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const active = hovered || focused

  return (
    <PreviewCard
      __unstable_focusRing
      as="button"
      data-testid={props.testId}
      onBlur={() => setFocused(false)}
      onClick={props.onClick}
      onFocus={() => setFocused(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      pressed={Boolean(props.viewed) && !active}
      radius={2}
      role="menuitem"
      selected={active}
      sizing="border"
      style={{display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer'}}
      tabIndex={-1}
      tone="inherit"
      type="button"
    >
      {/* The same box as a document list row (`DefaultPreview`): 8px padding, a 33px media slot, a title and a muted subtitle 8px apart, both trimmed. */}
      <Flex alignItems="center" padding={2} paddingLeft={props.renderMedia ? 2 : 3}>
        <Flex alignItems="center" flexBasis="0%" flexGrow={1} gap={2} style={{minHeight: 33}}>
          {props.renderMedia ? (
            <Flex
              alignItems="center"
              flexBasis="auto"
              flexGrow={0}
              flexShrink={0}
              justifyContent="center"
              style={{width: 33, height: 33}}
            >
              {props.renderMedia(active)}
            </Flex>
          ) : null}
          <Flex flexBasis="0%" flexDirection="column" flexGrow={1} gap={2} style={{minWidth: 0}}>
            {props.title}
            {props.subtitle ? (
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
            ) : null}
          </Flex>
          <Flex
            alignItems="center"
            aria-hidden
            data-testid="document-versions-flyout-row-marks"
            flexBasis="auto"
            flexGrow={0}
            flexShrink={0}
            justifyContent="center"
            style={{width: MARK_COLUMN_WIDTH}}
          >
            {props.renderTrailing?.(active)}
          </Flex>
        </Flex>
      </Flex>
    </PreviewCard>
  )
}

function AudienceRow({
  group,
  onClick,
  viewed,
}: {
  group: DocumentVersionStatusGroup
  onClick: () => void
  viewed: boolean
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
      subtitle={subtitle}
      viewed={viewed}
      testId="document-versions-flyout-row"
      renderTrailing={(active) => (
        <span style={{display: 'flex', height: 25, alignItems: 'center'}}>
          {group.variantId ? (
            <Icon
              icon={RhombusIconLarge}
              size={1}
              style={
                {
                  'margin': '-0.375rem',
                  '--icon-color': active
                    ? 'var(--card-fg-color)'
                    : 'var(--card-badge-suggest-dot-color)',
                } as CSSProperties
              }
            />
          ) : null}
        </span>
      )}
      title={
        <Text as="div" size={1} style={{color: 'inherit'}} trim truncate={1} weight="medium">
          {name}
        </Text>
      }
    />
  )
}

/**
 * The content of the versions flyout on a document list row: one row per audience, with its latest
 * event as the subtitle and the variant diamond in a trailing column at the right edge, and a last row that opens the document group
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

  if (loading) {
    return (
      <Card
        aria-label={t('document-group.flyout.title')}
        border
        data-testid="document-versions-flyout-loading"
        padding={3}
        radius={3}
      >
        <Text muted size={1}>
          {t('common.loading')}
        </Text>
      </Card>
    )
  }

  const total = groups.reduce((count, group) => count + group.items.length, 0)

  return (
    <Card
      aria-label={t('document-group.flyout.title')}
      border
      data-testid="document-versions-flyout"
      radius={3}
      role="menu"
    >
      <div className={root}>
        {groups.slice(0, MAX_AUDIENCES).map((group) => (
          <AudienceRow
            group={group}
            key={group.variantId ?? 'default'}
            onClick={() => onPick(group.variantId ?? null)}
            viewed={viewingDocument && (group.variantId ?? undefined) === viewedVariantId}
          />
        ))}
        <FlyoutRow
          renderMedia={(active) => (
            <Icon icon={DocumentsIcon} size={2} style={activeIconStyle(active)} />
          )}
          onClick={onOpenInventory}
          testId="document-versions-flyout-inventory"
          title={
            <Text as="div" size={1} style={{color: 'inherit'}} trim truncate={1} weight="medium">
              {total > 1
                ? t('document-group.flyout.see-all', {count: total})
                : t('document-group.flyout.manage-versions')}
            </Text>
          }
          renderTrailing={(active) => (
            <Icon icon={ChevronRightIcon} size={1} style={activeIconStyle(active)} />
          )}
        />
      </div>
    </Card>
  )
}
