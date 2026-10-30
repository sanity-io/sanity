import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CloseIcon} from '@sanity/icons/Close'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {DotIcon} from '@sanity/icons/Dot'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Box, Flex, Label, Text, TextInput, useTheme_v2} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {
  type ComponentProps,
  type CSSProperties,
  Fragment,
  type ReactElement,
  type ReactNode,
  useState,
} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  isCardinalityOneRelease,
  isReleaseScheduledOrScheduling,
  ReleaseAvatarIcon,
  useActiveReleases,
  usePerspective,
  useSchema,
  useSetVariant,
  useWorkspace,
} from 'sanity'

import {RhombusIcon} from '../../../packages/sanity/src/core/components/temporary-icons/Rhombus'
import {type ReleaseId} from '../../../packages/sanity/src/core/perspective/types'
import {Chip} from '../../../packages/sanity/src/core/releases/components/Chip'
import {RELEASE_TYPES_TONES} from '../../../packages/sanity/src/core/releases/util/const'
import {getReleaseTone} from '../../../packages/sanity/src/core/releases/util/getReleaseTone'
import {type SystemVariant} from '../../../packages/sanity/src/core/variants/types'
import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {Tooltip} from '../../../packages/sanity/src/ui-components/tooltip/Tooltip'
import {DimensionIcon, VariantDiamondOutline} from '../c1/dimensionIcons'
import {valueTitle} from '../c1/model'
import {rankSearch, type SearchFields} from '../c1/search'
import {usePerspectiveState} from '../c1/state'
import {useVariantDefinitions} from '../c1/world'
import {sortVersions} from '../c12/sortVersions'
import {useBaseNames} from '../c15/baseName'
import {useVersionList} from '../data/useVersionList'
import {type AudienceVersion, dateLabel, inOpenBeta} from '../data/versions'
import {useOption, useOptionState} from '../options/store'

/**
 * Ported from the Handoff Studio (dev/variants-handoff-studio/c2/DocumentPills.tsx, 22 Oct), so C2 option A here is what was handed off.
 * C2 option A (the open beta, OPEN-BETA-HANDOFF-SCOPE T2): the document pills with their order and grouping changed, in the same place as the
 * Studio's own pills. Variants group first, a divider, Published, Draft, then one Releases group: one flat entry per release in its menu, then
 * the other active releases greyed, and the count is the number of releases this document is in. The way into the inventory is the pane header's own button, so there is
 * no Versions pill. Titles, never ids. A group is not drawn when it is empty: no Variants pill without variants, no Releases pill without
 * releases, no Draft pill when the workspace has no draft model or the type is live edit.
 */

const stateWord = (v: AudienceVersion) =>
  v.state === 'published'
    ? 'Published'
    : v.state === 'draft'
      ? 'Draft'
      : v.release
        ? `${v.release}${v.when ? ` · ${v.when}` : ''}`
        : v.state

function glyph(v: AudienceVersion) {
  if (v.state === 'published') return <ReleaseAvatarIcon release="published" />
  if (v.state === 'draft') return <ReleaseAvatarIcon release="drafts" />
  return (
    <ReleaseAvatarIcon
      releaseType={
        v.state === 'scheduled' ? 'scheduled' : v.state === 'asap' ? 'asap' : 'undecided'
      }
    />
  )
}

/**
 * The release mark the PILL carries: the same dot as the Published and Draft chips, in the release type's tone. The type icon (clock, bolt) is
 * 13px wide where the other pills' marks are 4 to 7px, so in the row it reads as a different kind of pill; the menu rows keep the type icon.
 */
function releaseDot(v: AudienceVersion) {
  const type = v.state === 'scheduled' ? 'scheduled' : v.state === 'asap' ? 'asap' : 'undecided'
  const style: CSSProperties & {'--card-icon-color': string} = {
    '--card-icon-color': `var(--card-badge-${RELEASE_TYPES_TONES[type].tone}-icon-color)`,
  }
  return <DotIcon style={style} />
}

/** A quiet count on each Variants row: how many versions that variant has on this document. Faheem may drop it: set false. */
const SHOW_VERSION_COUNT = true

/** Where a version sits, by name: Published, Draft, or its release's title. */
const placeWord = (v: AudienceVersion) =>
  v.state === 'published' ? 'Published' : v.state === 'draft' ? 'Draft' : (v.release ?? v.state)

/**
 * The slot at a row's right end (26 Oct): the number first, then the icon. A row with no version yet has no slot: no plus (27 Oct, Faheem:
 * the menus are for moving between versions; the create action is the banner's and the inventory's). It is a flex sibling of the row's content (through MenuItem's renderMenuItem), not inside the row's Text:
 * a Text's line box moved it off the text's line, and the row centres it on the content as it centres the leading icon.
 */
/** C12 B inside a section: A to Z (the section already says whether this document has the version). */
function byTitle<T extends {key: string; text: string}>(items: T[]): T[] {
  return sortVersions(items, (item) => ({variant: item.key, has: true, title: item.text}))
}

const SLOT_WIDTH = 'calc(2ch + 4px + 16px)'
const SLOT_ICON: CSSProperties = {display: 'block', flex: 'none', fontSize: 16, margin: 0}
function RowSlot({children}: {children: ReactNode}) {
  return (
    <span
      style={{
        alignItems: 'center',
        color: 'var(--card-muted-fg-color)',
        display: 'flex',
        flex: 'none',
        fontSize: 13,
        gap: 4,
        height: 16,
        justifyContent: 'flex-end',
        lineHeight: '16px',
        width: SLOT_WIDTH,
      }}
    >
      {children}
    </span>
  )
}

/**
 * The count at a Variants row's right end: the number, then the stacked-pages icon, both in the row's muted text. Its tooltip names the
 * versions ("3 versions: Published, Draft, Black Friday").
 */
function VersionCount({versions}: {versions: readonly AudienceVersion[]}) {
  const n = versions.length
  return (
    <RowSlot>
      <Tooltip
        content={`${n} ${n === 1 ? 'version' : 'versions'}: ${versions.map(placeWord).join(', ')}`}
        placement="top"
      >
        <span
          data-testid="variant-version-count"
          style={{alignItems: 'center', display: 'flex', gap: 4, height: 16}}
        >
          {/* A fixed-width, right-aligned number: one- and two-digit counts line up down the menu. */}
          <span style={{fontVariantNumeric: 'tabular-nums', minWidth: '2ch', textAlign: 'right'}}>
            {n}
          </span>
          <DocumentsIcon style={SLOT_ICON} />
        </span>
      </Tooltip>
    </RowSlot>
  )
}

const isVariantId = (id: string): id is SystemVariant['_id'] => id.startsWith('_.variants.')

/** The menus show 10 rows before they scroll, as the navbar's menus do (the same count of rows); rows are the 33px MenuItem. */
const LIST_MAX = 10 * 33 + 4

function DropdownPill(props: {
  text: string
  items: {
    key: string
    text: string
    icon: ReactElement
    onClick?: () => void
    /** Quiet text at the row's right end (the Variants rows' version count). */
    trailing?: ReactElement
    /** The row is what is in view (the Variants menu's "All users (Default)" with no variant chosen). */
    selected?: boolean
    /** A create row's tooltip ("Create Black Friday version", "Add to Black Friday"). */
    hint?: string
    /** What search matches an option by (the title is its text when this is left out). */
    search?: Omit<SearchFields, 'title'>
    /** The section the row sits in ("Has 3 variants", "Other variants"). A row with none (the default) stands alone above them. */
    section?: string
    /** Stands in for the rows of a section with none ("Has 0 variants"): draws no row, only the section heading, whose info mark shows
     * `hint` as a tooltip. Not a search result. */
    placeholder?: boolean
  }[]
  testId: string
  /** The leading glyph, as the stock Published and Draft chips have one: it gives the pill their left inset and size. */
  icon: ReactElement
  /** The perspective in view is one of its entries (a release): marked like the stock chips mark theirs. */
  selected?: boolean
  /** The pill's tone when selected: it fills with its own tone (Faheem, 22 Oct), the Variants pill purple (suggest), the Releases pill the
   * release in view's (grey for scheduled and undecided, yellow for ASAP). */
  tone?: ComponentProps<typeof Chip>['tone']
  /** With a choice in view, a cross after the pill clears it (as the navbar chips' cross does), with this accessible name. */
  clear?: {label: string; onClick: () => void}
  /** A line under the search that is always there while it is set, not a tooltip: what the greyed rows mean (Faheem, 26 Oct). */
  note?: string
}) {
  const [query, setQuery] = useState('')
  // Search at the top, always, then the rows in a list that scrolls past 10 rows (the navbar menus' pattern, with no footer).
  const found = rankSearch(
    props.items.filter((item) => !item.placeholder || !query.trim()),
    query,
    (item) => ({title: item.text, ...item.search}),
  )
  const tone = props.selected ? props.tone : undefined
  // A selected capsule takes the selected ghost chip's colours (as the stock Draft chip beside it): its segments are bleed chips, whose
  // selected fill is paler and whose border is clear, so the capsule's own outline and hairline showed grey on the tone (Faheem, 29 Oct).
  const {color} = useTheme_v2()
  const pressed = tone ? color.button.ghost[tone]?.pressed : undefined
  const segmentStyle = pressed ? ({'--card-bg-color': pressed.bg} as CSSProperties) : undefined
  const lineColor = pressed?.border
  const menu = (
    <MenuButton
      button={
        <Chip
          data-testid={props.testId}
          icon={props.icon}
          iconRight={ChevronDownIcon}
          // With a cross the pill is the first segment of one capsule, as the navbar chips are: the capsule draws the outline and clips the fill.
          mode={props.clear ? 'bleed' : 'ghost'}
          // The chevron's glyph sits 0.7px inside its box: the right inset is taken to the glyph, so it ends 12px from the edge like the
          // stock chips' text does.
          paddingRight={0}
          radius={props.clear ? 0 : 'full'}
          selected={props.selected}
          tone={tone}
          style={{
            paddingRight: props.clear ? 8 : 11.3,
            ...(props.clear ? segmentStyle : undefined),
          }}
          text={props.text}
        />
      }
      id={props.testId}
      menu={
        // The navbar menus' width rule (core's GlobalPerspectiveMenu, c1/primitives): as wide as the widest row, 280 to 360px, so the two pill
        // menus match each other and the navbar's.
        <Menu
          data-testid={`${props.testId}-menu`}
          padding={1}
          style={{maxWidth: 360, minWidth: 280, width: 'max-content'}}
        >
          <Box padding={1}>
            <TextInput
              aria-label="Find"
              data-testid={`${props.testId}-search`}
              fontSize={1}
              // The menu would take typing for its own keys; only the arrows are its.
              onKeyDown={(event) => {
                if (!['ArrowDown', 'ArrowUp', 'Escape'].includes(event.key)) event.stopPropagation()
              }}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Find"
              value={query}
            />
          </Box>
          {props.note ? (
            <Box data-testid={`${props.testId}-note`} paddingX={3} paddingBottom={2} paddingTop={1}>
              <Text muted size={1}>
                {props.note}
              </Text>
            </Box>
          ) : null}
          <div
            data-testid={`${props.testId}-list`}
            style={{maxHeight: LIST_MAX, overflowY: 'auto'}}
          >
            {found.map(({item, reason}, index) => {
              // Sections (27 Oct call, Pedro and Andrej; Studio Patterns PerspectiveMenu.Variant): what this document has on top, the rest
              // below, each under a divider and a heading. A search result is one ranked list, so it has neither.
              const previous = found[index - 1]?.item
              const startsSection =
                !query.trim() && item.section !== previous?.section && (index > 0 || item.section)
              return (
                <Fragment key={item.key}>
                  {startsSection && index > 0 ? (
                    <div
                      aria-hidden
                      style={{borderTop: '1px solid var(--card-border-color)', margin: '4px 0'}}
                    />
                  ) : null}
                  {startsSection && item.section ? (
                    <Flex align="center" gap={2} paddingLeft={3} paddingTop={3} paddingBottom={2}>
                      <Label muted size={1} style={{textTransform: 'uppercase'}}>
                        {item.section}
                      </Label>
                      {/* An empty section says why in a tooltip on its info mark (30 Oct, Faheem; as the Handoff Studio, 574a45ed37). */}
                      {item.placeholder && item.hint ? (
                        <Tooltip content={item.hint} placement="top" portal>
                          <span
                            aria-label={item.hint}
                            data-testid={`${props.testId}-empty-info`}
                            role="img"
                            style={{display: 'inline-flex'}}
                          >
                            <Text muted size={1}>
                              <InfoOutlineIcon />
                            </Text>
                          </span>
                        </Tooltip>
                      ) : null}
                    </Flex>
                  ) : null}
                  {item.placeholder ? null : (
                    <MenuItem
                      __unstable_subtitle={reason}
                      disabled={!item.onClick}
                      icon={item.icon}
                      pressed={item.selected}
                      selected={item.selected}
                      onClick={item.onClick}
                      text={item.text}
                      tooltipProps={item.hint ? {content: item.hint, placement: 'left'} : null}
                      renderMenuItem={
                        item.trailing
                          ? (content) => (
                              <Flex align="center" gap={3}>
                                <Box flex={1} style={{minWidth: 0}}>
                                  {content}
                                </Box>
                                {item.trailing}
                              </Flex>
                            )
                          : undefined
                      }
                    />
                  )}
                </Fragment>
              )
            })}
          </div>
          {!found.length ? (
            <Box padding={3}>
              <Text muted size={1}>{`Nothing matches “${query}”.`}</Text>
            </Box>
          ) : null}
        </Menu>
      }
      onClose={() => setQuery('')}
      popover={{placement: 'bottom-start', portal: true}}
    />
  )
  if (!props.clear) return menu
  return (
    <span
      data-testid={`${props.testId}-capsule`}
      style={{
        alignItems: 'stretch',
        borderRadius: 'var(--v2-pill-radius, 9999px)',
        display: 'inline-flex',
        flex: 'none',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {menu}
      {/* The hairline between the two targets, the pill's full height as on the navbar chips; readable on the selected fill too (the card's
          border colour disappears on it). */}
      <span
        aria-hidden
        style={{
          alignSelf: 'stretch',
          background: lineColor ?? 'var(--card-muted-fg-color)',
          flex: 'none',
          opacity: lineColor ? 1 : 0.35,
          width: 1,
        }}
      />
      <Chip
        aria-label={props.clear.label}
        data-testid={`${props.testId}-clear`}
        // Compact, as on the navbar chips: a smaller cross, with more room on the round end's side so it does not crowd the curve.
        icon={<CloseIcon style={{transform: 'scale(0.8)'}} />}
        mode="bleed"
        onClick={props.clear.onClick}
        paddingLeft={2}
        paddingRight={3}
        radius={0}
        selected={props.selected}
        style={segmentStyle}
        tone={tone}
      />
      {/* The outline drawn over the segments (so it adds no height): the pill stays the stock chips' 25px. */}
      <span
        aria-hidden
        style={{
          borderRadius: 'var(--v2-pill-radius, 9999px)',
          boxShadow: `inset 0 0 0 1px ${lineColor ?? 'var(--card-border-color)'}`,
          inset: 0,
          pointerEvents: 'none',
          position: 'absolute',
        }}
      />
    </span>
  )
}

export function OpenBetaPills({
  documentId,
  documentType,
  manage,
}: {
  documentId: string
  documentType: string
  /** C4 B's Manage versions icon, at the row's end. */
  manage?: ReactElement
}) {
  const allVersions = useVersionList(documentId)
  // The open beta stage has one dimension (Audience), as the Handoff Studio: a variant on another dimension is not listed. GA lists them all.
  const {stage} = useOptionState()
  // C12: B sorts the two menus' rows by one rule (c12/sortVersions.ts); A keeps today's order.
  const sorted = useOption('c12') === 'b'
  const names = useBaseNames()
  const baseLabel = names.menu
  const {selectedPerspectiveName, selectedVariantName} = usePerspective()
  const setVariant = useSetVariant()
  const address = usePerspectiveState()
  const definitions = useVariantDefinitions()
  const schemaType = useSchema().get(documentType)
  const workspace = useWorkspace()
  const draftsEnabled = workspace.document.drafts.enabled
  const releasesEnabled = !!workspace.releases?.enabled
  const {data: activeReleases} = useActiveReleases()
  // Never render nothing: the pane header's chip scroller observes this row's element.
  if (!allVersions) return <Flex data-testid="doc-pills-a" gap={1} />
  const versions =
    stage === 'open-beta'
      ? allVersions.filter(
          (v) =>
            !v.variantId ||
            inOpenBeta(
              definitions.find((d) => d._id.replace(/^_\.variants\./, '') === v.variantId)
                ?.conditions,
            ),
        )
      : allVersions

  const published = versions.find((v) => v.audience === null && v.state === 'published')
  // Every version that sits in a release counts, base or variant.
  const releases = versions.filter((v) => v.release)
  const variants = versions.filter((v) => v.audience !== null)
  // Live edit has no draft, and a workspace without the draft model has none either.
  const showDrafts = draftsEnabled && !schemaType?.liveEdit
  // Without drafts the pane shows the published version under the Drafts perspective, so Published is the pill in view (Faheem, 23 Oct:
  // "on top it shows Draft" while the pane showed Published, unselected).
  const named = selectedPerspectiveName ?? 'drafts'
  const current = !showDrafts && named === 'drafts' ? 'published' : named
  // The default version, where unselecting a release goes back to: Drafts, or Published where the drafts model is off.
  const defaultVersion: ReleaseId = draftsEnabled ? 'drafts' : 'published'
  const showPublished = Boolean(published) || (!showDrafts && !releases.length)

  const currentVariant = selectedVariantName?.replace(/^_\.variants\./, '')
  // Every pill is a proxy for the navbar: ONE navigation sets the version and the router's variant param together, as the navbar toggle and the
  // inventory do (in the open beta that param is the only copy of the choice). The two pill menus are independent axes, like the navbar chips
  // (Faheem, 22 Oct): Variants sets who, and Published, Draft or a release sets where, KEEPING the variant. Back to the base is All users
  // (Default) in the Variants menu, the Variants pill's cross, or the navbar audience's cross.
  const goTo = (perspective: ReleaseId, definition?: (typeof definitions)[number]) => {
    const id = definition?._id
    setVariant({variantId: id && isVariantId(id) ? id : undefined, perspective})
    address.setChosen(definition ? definition.conditions : {})
  }
  const definitionOf = (v: AudienceVersion) =>
    definitions.find((d) => d._id.replace(/^_\.variants\./, '') === v.variantId)
  // The variant in view (or none): every Published, Draft and release choice keeps it.
  const viewedDefinition = definitions.find(
    (d) => d._id.replace(/^_\.variants\./, '') === currentVariant,
  )
  // One row per VARIANT this document has (not per version): picking it sets only the variant and keeps the Published, Draft or release in
  // view, which the other pills change. A variant with no version there still opens; the T6 banner says so.
  const viewedVariant = variants.find((v) => v.variantId === currentVariant)
  // The chosen variant when this document has no version of it: the pill still names it, so the global and local pills agree (Faheem, 22 Oct).
  const viewedMissing = viewedVariant
    ? undefined
    : definitions.find((d) => d._id.replace(/^_\.variants\./, '') === currentVariant)
  const viewedTitle =
    viewedVariant?.audience ??
    (viewedMissing ? (viewedMissing.metadata?.title ?? currentVariant) : undefined)
  const variantGroups = [...new Set(variants.map((v) => v.variantId ?? v.audience))].map((key) =>
    variants.filter((v) => (v.variantId ?? v.audience) === key),
  )
  const variantItems = variantGroups.map((group) => {
    const v = group[0]
    const definition = definitionOf(v)
    const [name, value] = Object.entries(definition?.conditions ?? {})[0] ?? []
    const spec = address.dimensions.find((d) => d.name === name)
    return {
      key: `variant-${v.variantId ?? v.audience}`,
      text: v.audience ?? '',
      icon: <DimensionIcon name={name ?? address.dimensions[0]?.name ?? ''} />,
      // Picking the chosen variant again unselects it: back to All users, keeping the version in view (Faheem, 22 Oct).
      onClick:
        v.variantId && !definition
          ? undefined
          : () => goTo(current, v.variantId === currentVariant ? undefined : definition),
      trailing: SHOW_VERSION_COUNT ? <VersionCount versions={group} /> : undefined,
      selected: Boolean(v.variantId) && v.variantId === currentVariant,
      section: `Has ${variantGroups.length} ${variantGroups.length === 1 ? 'variant' : 'variants'}`,
      search: {
        condition: name
          ? {dimension: name, value: spec ? valueTitle(spec, String(value)) : String(value)}
          : undefined,
        id: v.variantId ?? undefined,
      },
    }
  })
  // The Variants menu starts with the base document, "All users (Default)", as the navbar's Audience menu does (Faheem, 22 Oct): picking it
  // clears the variant and keeps the Published, Draft or release in view. Its count is the base versions; it is marked while no variant is chosen.
  const baseVersions = versions.filter((v) => v.audience === null)
  const baseItem = {
    key: 'variant-base',
    text: baseLabel,
    icon: <DimensionIcon name={address.dimensions[0]?.name ?? ''} />,
    onClick: () => goTo(current),
    trailing: SHOW_VERSION_COUNT ? <VersionCount versions={baseVersions} /> : undefined,
    selected: !currentVariant,
  }
  // Then every other variant, under Other variants with the empty diamond: picking one moves the global perspective to it (the version in
  // view kept), where the banner offers Create version (Faheem, 22 Oct). No count: there is no version yet. The open beta stage lists Audience
  // ones only. (From the Handoff Studio, 477bf59e33 to 61622dfef4.)
  const missingItems = definitions
    .filter((d) => stage !== 'open-beta' || inOpenBeta(d.conditions))
    .filter((d) => !variants.some((v) => v.variantId === d._id.replace(/^_\.variants\./, '')))
    .map((definition) => {
      const id = definition._id.replace(/^_\.variants\./, '')
      return {
        key: `variant-missing-${id}`,
        text: definition.metadata?.title ?? id,
        // The empty diamond: defined, but no version of this document yet (27 Oct call, Pedro).
        icon: <VariantDiamondOutline />,
        onClick: () => goTo(current, id === currentVariant ? undefined : definition),
        hint: `Create ${definition.metadata?.title ?? id} version`,
        selected: id === currentVariant,
        search: {id},
        section: 'Other variants',
      }
    })
  // One flat row per RELEASE this document is in (the pill counts releases, not versions); no variants nested under them (22 Oct call).
  const releaseIds = [...new Set(releases.flatMap((v) => (v.bundleId ? [v.bundleId] : [])))]
  const releaseItems = releaseIds.map((bundleId) => {
    const head = releases.find((v) => v.bundleId === bundleId) as AudienceVersion
    return {
      key: `release-${bundleId}`,
      text: stateWord({...head, audience: null}),
      icon: glyph(head),
      // Picking the release in view again unselects it: back to the default version, keeping the variant (as the navbar chip's cross).
      onClick: () => goTo(current === bundleId ? defaultVersion : bundleId, viewedDefinition),
      selected: current === bundleId,
      search: {id: bundleId},
      section: `In ${releaseIds.length} ${releaseIds.length === 1 ? 'release' : 'releases'}`,
    }
  })
  // Then every other active release, under Other releases, as the Variants menu lists the variants this document has none of: picking one
  // moves to that release and KEEPS the variant in view, where the T6 banner offers Create version (or, for a locked or scheduled release, says
  // so with no button, as it already does).
  const missingReleaseItems = activeReleases
    .filter((release) => !isCardinalityOneRelease(release))
    .map((release) => ({release, id: getReleaseIdFromReleaseDocumentId(release._id)}))
    .filter(({id}) => !releaseIds.includes(id))
    .map(({release, id}) => ({
      key: `release-missing-${id}`,
      // A scheduled release carries its date, as the rows above do ("Black Friday · 20 Nov"): two releases may share a title.
      text: `${release.metadata.title || 'Untitled release'}${
        release.metadata.releaseType === 'scheduled' && release.metadata.intendedPublishAt
          ? ` · ${dateLabel(release.metadata.intendedPublishAt, undefined)}`
          : ''
      }`,
      icon: <ReleaseAvatarIcon releaseType={release.metadata.releaseType} />,
      onClick: () => goTo(current === id ? defaultVersion : id, viewedDefinition),
      hint: `Add to ${release.metadata.title || 'Untitled release'}`,
      selected: current === id,
      search: {id},
      section: 'Other releases',
    }))
  const releaseCount = new Set(releases.map((v) => v.bundleId)).size
  // The release in view, if any (this document's, or another picked from the greyed rows): the pill names it and gets the cross, as the
  // navbar chip does (Faheem, 22 Oct). The cross goes back to the default version, keeping the variant.
  const inView = [...releaseItems, ...missingReleaseItems].find((item) => item.selected)
  const inViewRelease = activeReleases.find(
    (release) => getReleaseIdFromReleaseDocumentId(release._id) === current,
  )
  const hasEarlierGroup = variants.length > 0
  // C12 B sorts inside each section, so a heading never repeats: the default, then the variants this document has, then the others, each A
  // to Z; in the Releases menu the releases this document is in, then the others, each by when it publishes (ASAP, dated, undecided, then
  // scheduled).
  const releaseById = new Map(
    activeReleases.map((release) => [getReleaseIdFromReleaseDocumentId(release._id), release]),
  )
  const byPublish = <T extends {text: string; search: {id: string}}>(items: T[]) =>
    sortVersions(items, (item) => {
      const release = releaseById.get(item.search.id)
      return {
        place: {
          type: release?.metadata.releaseType,
          at: release?.metadata.intendedPublishAt,
          locked: release ? isReleaseScheduledOrScheduling(release) : false,
        },
        variant: null,
        has: true,
        title: item.text,
      }
    })
  // "Has N variants" and "In N releases" are always there, so the sections keep their places before and after the first one is created; at 0
  // the heading carries an info mark with the reason in a tooltip (30 Oct, Pedro and Faheem; SAPP-4722, Andrej's empty-text finding).
  const noVariants = {
    key: 'variant-none',
    text: '',
    icon: <></>,
    hint: 'No variants yet. Pick one to create it.',
    section: 'Has 0 variants',
    placeholder: true,
  }
  const noReleases = {
    key: 'release-none',
    text: '',
    icon: <></>,
    hint: 'Not in a release yet. Pick one to add it.',
    section: 'In 0 releases',
    placeholder: true,
  }
  const variantRows = [
    baseItem,
    ...(variantItems.length ? (sorted ? byTitle(variantItems) : variantItems) : [noVariants]),
    ...(sorted ? byTitle(missingItems) : missingItems),
  ]
  const releaseRows = [
    ...(releaseItems.length ? (sorted ? byPublish(releaseItems) : releaseItems) : [noReleases]),
    ...(sorted ? byPublish(missingReleaseItems) : missingReleaseItems),
  ]

  return (
    // It replaces the stock pills in the pane header (PROPOSED slot), so it takes the header's own row, no border.
    <Flex
      align="center"
      data-testid="doc-pills-a"
      gap={2}
      style={{flex: '1 1 0%', minWidth: 0}}
      wrap="wrap"
    >
      {/* A chosen variant is named here even when this document has none of its own, so the navbar, pills and banner agree (Faheem, 23 Oct).
          26 Oct call (Pedro): the pill is there whenever a variant is defined, greyed while this document has none, so it is always where to
          look and a version can be created from its menu. */}
      {variants.length || viewedTitle || missingItems.length ? (
        <DropdownPill
          icon={<RhombusIcon />}
          clear={
            viewedTitle ? {label: `Back to ${names.back}`, onClick: () => goTo(current)} : undefined
          }
          items={variantRows}
          // A variant of this document is in view (in whatever Published, Draft or release): marked like the Releases pill marks a release.
          selected={Boolean(viewedTitle)}
          testId="pills-variants"
          // With a variant of this document in view the pill names it, in purple (Faheem, 22 Oct); otherwise it counts the variants.
          text={
            viewedTitle ??
            (variantGroups.length ? `Variants · ${variantGroups.length}` : 'Variants')
          }
          tone="suggest"
        />
      ) : null}
      {hasEarlierGroup ? (
        <div
          aria-hidden
          data-testid="pills-divider"
          style={{
            alignSelf: 'stretch',
            width: 1,
            margin: '4px',
            background: 'var(--card-border-color)',
          }}
        />
      ) : null}
      {showPublished ? (
        <Chip
          data-testid="pills-published"
          // Selected, the dot takes the filled pill's own icon colour (as the Variants pill's glyph does): the green dot on the green fill is
          // under 3:1 in the light theme.
          icon={current === 'published' ? <DotIcon /> : <ReleaseAvatarIcon release="published" />}
          mode="ghost"
          onClick={() => goTo('published', viewedDefinition)}
          // Both axes apply: the version in view is selected as well as the Variants pill naming the variant.
          selected={current === 'published'}
          // Selected, it fills with its own tone, as the Variants pill does with purple (Faheem, 22 Oct): green.
          text="Published"
          tone={current === 'published' ? 'positive' : undefined}
        />
      ) : null}
      {showDrafts ? (
        <Chip
          data-testid="pills-drafts"
          icon={current === 'drafts' ? <DotIcon /> : <ReleaseAvatarIcon release="drafts" />}
          mode="ghost"
          onClick={() => goTo('drafts', viewedDefinition)}
          selected={current === 'drafts'}
          text="Draft"
          // Yellow, the draft's tone.
          tone={current === 'drafts' ? 'caution' : undefined}
        />
      ) : null}
      {/* As the Variants pill: with releases on and one defined, the pill is there, greyed while this document is in none (26 Oct call). */}
      {releases.length || (releasesEnabled && missingReleaseItems.length) ? (
        <DropdownPill
          clear={
            inView
              ? {label: 'Leave release', onClick: () => goTo(defaultVersion, viewedDefinition)}
              : undefined
          }
          // The release in view, else the first one, as a dot (its menu rows keep the type icon).
          // With a release in view the pill is filled in its tone, and the dot takes the fill's own icon colour, as the other pills' do.
          icon={
            inViewRelease ? (
              <DotIcon />
            ) : // In none: a plain dot, as the pill is greyed.
            releases.length ? (
              releaseDot(releases.find((v) => v.bundleId === current) ?? releases[0])
            ) : (
              <DotIcon />
            )
          }
          items={releaseRows}
          // Any release in view, this document's or another (picked from the greyed rows).
          selected={current !== 'published' && current !== 'drafts'}
          testId="pills-releases"
          text={inView?.text ?? (releaseCount ? `Releases · ${releaseCount}` : 'Releases')}
          // The release in view's tone, as core gives it.
          tone={inViewRelease ? getReleaseTone(inViewRelease) : undefined}
        />
      ) : null}
      {manage}
    </Flex>
  )
}
