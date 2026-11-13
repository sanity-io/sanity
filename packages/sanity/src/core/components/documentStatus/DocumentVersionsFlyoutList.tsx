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

/**
 * The flyout's colours: the ones the document list and the version inventory use. Grey is for
 * moving through the rows (hover and keyboard focus), the strong blue is for the version that is
 * open, and the open version stays blue when it is hovered or focused. UI 5 declares these
 * variables on `:root`; where a token is only defined per tone (`.sui-tone-*`), the value is the
 * palette steps that token resolves to, as in the inventory.
 */
const COLORS = {
  /** The open version's row: `--active-background-emphasized` (blue-600 / blue-400). */
  viewedBackground: 'var(--active-background-emphasized)',
  /** Its title: `--active-foreground-emphasized` (white / black). */
  viewedTitle: 'var(--active-foreground-emphasized)',
  /** Its subtitle: the low-emphasis selected foreground step of the blue (blue-100 / blue-900). */
  viewedSubtitle: 'light-dark(var(--blue-100), var(--blue-900))',
  /** Its variant diamond: the suggest tone's `--foreground-low-emphasized` (purple-100 / purple-900). */
  viewedMark: 'light-dark(var(--purple-100), var(--purple-900))',
  /**
   * A hovered or focused row: `--background-low` (gray-50) in light. In dark that token is gray-950,
   * the panel's own background, so dark takes the next step, gray-900.
   */
  hoverBackground: 'light-dark(var(--gray-50), var(--gray-900))',
  /** Keyboard focus, on any row: UI 5's focus outline, drawn just outside the row. */
  focusOutline: 'var(--focus-outline)',
} as const

function FlyoutRow(props: {
  testId: string
  title: ReactNode
  subtitle?: string
  renderMedia?: () => ReactNode
  /**
   * The row's status marks (the variant diamond), in a column at the right edge that is as wide on
   * every row, so the marks line up like the document list's and the inventory's. Rows without a
   * mark keep the empty column.
   */
  renderTrailing?: (viewed: boolean) => ReactNode
  onClick: () => void
  /** The version the pane is viewing: the strong selected blue, also while hovered or focused. */
  viewed?: boolean
}) {
  const viewed = Boolean(props.viewed)
  // Hover and keyboard focus are the grey of moving through the rows; the open version keeps its
  // blue, and focus also draws the focus outline, so it shows on the blue row too.
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  let backgroundColor: string | undefined
  if (viewed) backgroundColor = COLORS.viewedBackground
  else if (hovered || focused) backgroundColor = COLORS.hoverBackground

  return (
    <PreviewCard
      aria-current={viewed ? 'true' : undefined}
      as="button"
      data-testid={props.testId}
      data-focused={focused ? '' : undefined}
      data-hovered={hovered ? '' : undefined}
      data-viewed={viewed ? '' : undefined}
      onBlur={() => setFocused(false)}
      onClick={props.onClick}
      onFocus={() => setFocused(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      radius={2}
      role="menuitem"
      sizing="border"
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        backgroundColor,
        color: viewed ? COLORS.viewedTitle : undefined,
        outline: focused ? COLORS.focusOutline : undefined,
        // Outside the row, on the panel, so it shows on the blue of the open version too
        outlineOffset: focused ? 2 : undefined,
      }}
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
              {props.renderMedia()}
            </Flex>
          ) : null}
          <Flex flexBasis="0%" flexDirection="column" flexGrow={1} gap={2} style={{minWidth: 0}}>
            {props.title}
            {props.subtitle ? (
              <Text
                as="div"
                muted
                size={1}
                style={{color: viewed ? COLORS.viewedSubtitle : 'var(--card-muted-fg-color)'}}
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
            {props.renderTrailing?.(viewed)}
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
      renderTrailing={(isViewed) => (
        <span style={{display: 'flex', height: 25, alignItems: 'center'}}>
          {group.variantId ? (
            <Icon
              icon={RhombusIconLarge}
              size={1}
              style={
                {
                  'margin': '-0.375rem',
                  '--icon-color': isViewed
                    ? COLORS.viewedMark
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
            viewed={
              viewingDocument &&
              (group.variantId ? getVariantId(group.variantId) : undefined) === viewedVariantId
            }
          />
        ))}
        <FlyoutRow
          renderMedia={() => <Icon icon={DocumentsIcon} size={2} />}
          onClick={onOpenInventory}
          testId="document-versions-flyout-inventory"
          title={
            <Text as="div" size={1} style={{color: 'inherit'}} trim truncate={1} weight="medium">
              {t('document-group.flyout.see-all-versions')}
            </Text>
          }
          renderTrailing={() => <Icon icon={ChevronRightIcon} size={1} />}
        />
      </div>
    </Card>
  )
}
