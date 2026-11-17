import {type ReleaseDocument} from '@sanity/client'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {AvatarCounter, AvatarStack, Card} from '@sanity/ui'
import {type CSSProperties, type ReactNode, useMemo, useState} from 'react'
import {Flex, Icon, Text} from 'ui5'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {useCompactTimeAgo} from '../../hooks/useRelativeTime'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {getDefaultVariant} from '../../perspective/getDefaultVariant'
import {usePerspective} from '../../perspective/usePerspective'
import {useFormatRelativeLocalePublishDate} from '../../releases/hooks/useFormatRelativeLocalePublishDate'
import {type DocumentPresence} from '../../store/presence/types'
import {useWorkspace} from '../../studio/workspace'
import {readVersionType} from '../../util/versionsUtils'
import {getVariantId, getVariantTitle} from '../../variants/tool/util'
import {PreviewCard} from '../previewCard/PreviewCard'
import {RhombusIconLarge} from '../temporary-icons/Rhombus'
import {UserAvatar} from '../userAvatar/UserAvatar'
import {
  audienceDetail,
  audienceLead,
  audienceLine,
  audienceSeparator,
  root,
} from './DocumentVersionsFlyoutList.css'
import {latestEdit, useDocumentVersionStatusGroups} from './DocumentVersionsStatus'
import {
  type AudienceLine,
  type AudienceLineDetail,
  type AudienceLineLead,
  getAudienceLine,
} from './getAudienceLine'
import {getDocumentVersionStatusTimestampKey} from './getDocumentVersionStatusTimestampKey'
import {audienceKey, groupPresenceByAudience} from './groupPresenceByAudience'
import {hasMoreInInventory} from './hasMoreInInventory'
import {type DocumentVersionStatusGroup} from './sortDocumentVersionsForStatus'

type RowPresence = Omit<DocumentPresence, 'path'>

/** Audiences the flyout lists before its footer row. */
const MAX_AUDIENCES = 5

/** The trailing column of status marks: as wide on every row, so the marks line up at the right edge. */
const MARK_COLUMN_WIDTH = 25

/**
 * The avatar column just before the marks: as wide on every audience row, so the avatars line up.
 * Wide enough for two avatars and a count.
 */
const AVATAR_COLUMN_WIDTH = 52

/** At most this many avatars, then a count of the others. */
const MAX_AVATARS = 2

/**
 * People as overlapping avatars: at most two, then a count of the others. Who they are is the
 * stack's accessible name, and a tooltip on the avatars themselves (not the row): to the left of
 * them, so it does not cover the rows above and below.
 */
function PresenceAvatars({people}: {people: RowPresence[]}) {
  const {t} = useTranslation()
  const shown = people.slice(0, MAX_AVATARS)
  const hidden = people.length - shown.length
  const [first] = people
  const names =
    people.length === 1
      ? t('document-group.flyout.avatars.one', {displayName: first.user.displayName})
      : t('document-group.flyout.avatars.other', {
          displayName: first.user.displayName,
          count: people.length - 1,
        })
  return (
    <Tooltip content={names} fallbackPlacements={['top']} placement="left">
      <span
        aria-label={names}
        data-testid="document-versions-flyout-avatars"
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- can't be an img: the stack is markup, named as one image for screen readers
        role="img"
        style={{display: 'inline-flex'}}
      >
        {/* `maxLength` above the number of children, so the stack draws exactly what is given */}
        <AvatarStack maxLength={MAX_AVATARS + 2} size={0}>
          {shown.map((person) => (
            <UserAvatar key={person.user.id} size={0} user={person.user} />
          ))}
          {hidden > 0 ? <AvatarCounter count={hidden} /> : null}
        </AvatarStack>
      </span>
    </Tooltip>
  )
}

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
  /** A string is trimmed to one line; any other node handles its own truncation. */
  subtitle?: ReactNode
  renderMedia?: () => ReactNode
  /**
   * The people editing this row's audience (on the footer, everyone not on a listed row), in a
   * column just before the marks column. Set on every row (an empty array for nobody), so the
   * column is as wide on every row; left unset when nobody is editing the document, so no row
   * spends the room.
   */
  presence?: RowPresence[]
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
      // Only keyboard focus draws the outline and the grey: a mouse press also focuses the button,
      // and the row should not show an outline while the button is held down
      onFocus={(event) => setFocused(event.currentTarget.matches(':focus-visible'))}
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
                truncate={typeof props.subtitle === 'string' ? 1 : undefined}
              >
                {props.subtitle}
              </Text>
            ) : null}
          </Flex>
          {props.presence ? (
            <Flex
              alignItems="center"
              data-testid="document-versions-flyout-row-presence"
              flexBasis="auto"
              flexGrow={0}
              flexShrink={0}
              justifyContent="flex-end"
              style={{width: AVATAR_COLUMN_WIDTH}}
            >
              {props.presence.length > 0 ? <PresenceAvatars people={props.presence} /> : null}
            </Flex>
          ) : null}
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

/** The release's own name, or the placeholder for an untitled one. */
function useReleaseTitle(): (release: ReleaseDocument) => string {
  const {t} = useTranslation()
  return (release) => release.metadata.title || t('release.placeholder-untitled-release')
}

/**
 * An audience row's subtitle with Variants on: a lead and a detail ("Update scheduled Fri 28 Nov,
 * 9:00 · Black Friday"). When the line is too long the detail is cut short first, so the lead and
 * its date always show.
 */
function AudienceLineText({line, fallbackTime}: {line: AudienceLine; fallbackTime: string}) {
  const {t} = useTranslation()
  const formatPublishDate = useFormatRelativeLocalePublishDate()
  const releaseTitle = useReleaseTitle()
  // One relative time per line at most: the lead's or the detail's
  let at = fallbackTime
  if ('at' in line.lead) at = line.lead.at
  else if (line.detail && 'at' in line.detail) at = line.detail.at
  const timeAgo = useCompactTimeAgo(at)

  const leadText = (lead: AudienceLineLead): string => {
    switch (lead.kind) {
      case 'update-scheduled':
        return t('document-group.flyout.audience.lead.update-scheduled', {
          date: formatPublishDate(lead.release),
        })
      case 'first-publish-scheduled':
        return t('document-group.flyout.audience.lead.first-publish-scheduled', {
          date: formatPublishDate(lead.release),
        })
      case 'unpublished-edits':
        return t('document-group.flyout.audience.lead.unpublished-edits')
      case 'not-published-yet':
        return t('document-group.flyout.audience.lead.not-published-yet')
      case 'update-waiting':
        return t('document-group.flyout.audience.lead.update-waiting', {
          releaseTitle: releaseTitle(lead.release),
        })
      case 'published':
        return t('document-group.flyout.audience.lead.published', {date: timeAgo})
      case 'updated':
        return t('document-group.flyout.audience.lead.updated', {date: timeAgo})
      default: {
        const unknownLead: never = lead
        return unknownLead
      }
    }
  }

  const detailText = (detail: AudienceLineDetail): string => {
    switch (detail.kind) {
      case 'time-ago':
        return timeAgo
      case 'edited':
        return t('document-group.flyout.audience.detail.edited', {date: timeAgo})
      case 'release-name':
        return releaseTitle(detail.release)
      case 'in-release':
        return t('document-group.flyout.audience.detail.in-release', {
          releaseTitle: releaseTitle(detail.release),
        })
      case 'unpublished-edits':
        return t('document-group.flyout.audience.detail.unpublished-edits')
      case 'more-releases':
        return t('document-group.flyout.audience.detail.more-releases', {count: detail.count})
      case 'no-date-set':
        return t('document-group.flyout.audience.detail.no-date-set')
      default: {
        const unknownDetail: never = detail
        return unknownDetail
      }
    }
  }

  return (
    <span className={audienceLine} data-testid="document-versions-flyout-row-line">
      <span className={audienceLead} data-testid="document-versions-flyout-row-lead">
        {leadText(line.lead)}
      </span>
      {line.detail ? (
        <span className={audienceDetail} data-testid="document-versions-flyout-row-detail">
          <span aria-hidden className={audienceSeparator}>
            {' · '}
          </span>
          {detailText(line.detail)}
        </span>
      ) : null}
    </span>
  )
}

function AudienceRow({
  group,
  now,
  onClick,
  presence,
  variantsEnabled,
  viewed,
}: {
  group: DocumentVersionStatusGroup
  now: number
  onClick: () => void
  presence?: RowPresence[]
  variantsEnabled: boolean
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

  // Without Variants the row keeps its latest change. A draft that was never published says so in
  // words, since the row carries no status icons.
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
      presence={presence}
      subtitle={
        variantsEnabled ? (
          <AudienceLineText fallbackTime={version._updatedAt} line={getAudienceLine(group, now)} />
        ) : (
          subtitle
        )
      }
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
 * inventory. When there are more audiences than the flyout lists, that last row counts the others
 * ("See 2 more in the inventory"). The last row shows only when the inventory has more to see: a
 * document with only Published and/or Draft has none (see `hasMoreInInventory`). Rows are menu items, so the host can move focus between them with the arrow keys.
 *
 * @internal
 */
export function DocumentVersionsFlyoutList(props: {
  documentGroupId: string
  /** Called with the audience of the row that was picked (`null` for the default one). */
  onPick: (variantId: string | null) => void
  onOpenInventory: () => void
  /**
   * Who is editing the document, any version. Each person's avatar sits on the audience row that
   * holds the version they have open; a person on an audience the flyout does not list, or on no
   * audience row, sits on the footer row, so everyone editing shows once.
   */
  presence?: RowPresence[]
  /** Whether the document of this row is the one open in the pane, which marks the version it shows. */
  viewingDocument?: boolean
}) {
  const {documentGroupId, onOpenInventory, onPick, presence, viewingDocument = false} = props
  const {selectedVariantNames} = usePerspective()
  const viewedVariantId = getDefaultVariant(selectedVariantNames)
  const variantsEnabled = Boolean(useWorkspace().beta?.variants?.enabled)
  const {t} = useTranslation()
  const {groups, loading} = useDocumentVersionStatusGroups(documentGroupId)
  // The flyout is open for moments at a time, so the time it opened is close enough for the lines
  const [now] = useState(() => Date.now())

  const people = useMemo(() => {
    const seen = new Set<string>()
    return (presence ?? []).filter((entry) => {
      if (seen.has(entry.user.id)) return false
      seen.add(entry.user.id)
      return true
    })
  }, [presence])
  const presenceByAudience = useMemo(
    () => groupPresenceByAudience(groups, people),
    [groups, people],
  )
  const shownGroups = groups.slice(0, MAX_AUDIENCES)
  // Everyone not on a listed row goes on the footer, which opens the inventory where they are
  const footerPeople = useMemo(() => {
    const onRows = new Set<string>()
    for (const group of groups.slice(0, MAX_AUDIENCES)) {
      for (const person of presenceByAudience.get(audienceKey(group)) ?? []) {
        onRows.add(person.user.id)
      }
    }
    return people.filter((person) => !onRows.has(person.user.id))
  }, [groups, people, presenceByAudience])

  // Audiences past the first ones: the footer counts them, since that is where they are
  const hiddenCount = Math.max(0, groups.length - MAX_AUDIENCES)
  // The footer opens the inventory only when it has more to show than these rows: releases,
  // variants or rows past the cap. People who sit on no listed row keep it, so everyone shows once.
  const showFooter = hasMoreInInventory(groups, hiddenCount) || footerPeople.length > 0

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
        {shownGroups.map((group) => (
          <AudienceRow
            group={group}
            key={audienceKey(group)}
            now={now}
            onClick={() => onPick(group.variantId ?? null)}
            presence={
              people.length > 0 ? (presenceByAudience.get(audienceKey(group)) ?? []) : undefined
            }
            variantsEnabled={variantsEnabled}
            viewed={
              viewingDocument &&
              (group.variantId ? getVariantId(group.variantId) : undefined) === viewedVariantId
            }
          />
        ))}
        {showFooter ? (
          <FlyoutRow
            renderMedia={() => <Icon icon={DocumentsIcon} size={2} />}
            onClick={onOpenInventory}
            presence={people.length > 0 ? footerPeople : undefined}
            testId="document-versions-flyout-inventory"
            title={
              <Text as="div" size={1} style={{color: 'inherit'}} trim truncate={1} weight="medium">
                {hiddenCount > 0
                  ? t('document-group.flyout.footer.see-more', {count: hiddenCount})
                  : t('document-group.flyout.see-all-versions')}
              </Text>
            }
            renderTrailing={() => <Icon icon={ChevronRightIcon} size={1} />}
          />
        ) : null}
      </div>
    </Card>
  )
}
