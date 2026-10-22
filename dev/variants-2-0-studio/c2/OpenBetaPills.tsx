import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CloseIcon} from '@sanity/icons/Close'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {DotIcon} from '@sanity/icons/Dot'
import {Box, Flex, Text, TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type CSSProperties, type ReactElement, useState} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  isCardinalityOneRelease,
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
import {type SystemVariant} from '../../../packages/sanity/src/core/variants/types'
import {MenuButton} from '../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {Tooltip} from '../../../packages/sanity/src/ui-components/tooltip/Tooltip'
import {DimensionIcon} from '../c1/dimensionIcons'
import {valueTitle} from '../c1/model'
import {DEFAULT_LABEL} from '../c1/Picker'
import {rankSearch, type SearchFields} from '../c1/search'
import {usePerspectiveState} from '../c1/state'
import {useVariantDefinitions} from '../c1/world'
import {useVersionList} from '../data/useVersionList'
import {type AudienceVersion, dateLabel, inOpenBeta} from '../data/versions'
import {useOptionState} from '../options/store'

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
 * The count at a Variants row's right end: the stacked-pages icon, a little smaller than the row's leading icon, then the number, both in the
 * row's muted text. Its tooltip names the versions ("3 versions: Published, Draft, Black Friday").
 */
function VersionCount({versions}: {versions: readonly AudienceVersion[]}) {
  const n = versions.length
  return (
    <Tooltip
      content={`${n} ${n === 1 ? 'version' : 'versions'}: ${versions.map(placeWord).join(', ')}`}
      placement="top"
    >
      <span
        data-testid="variant-version-count"
        // Middle-aligned with a line height of 1, so the count adds no height to the row (the rows stay the menu's 33px). The offsets are
        // measured on what paints: the number, and the icon's glyph, centre on the label's line.
        style={{
          alignItems: 'center',
          color: 'var(--card-muted-fg-color)',
          display: 'inline-flex',
          gap: 2,
          lineHeight: 1,
          position: 'relative',
          top: -1,
          verticalAlign: 'middle',
        }}
      >
        {/* Text gives an icon negative margins to sit in its line box; here they would cover the number. */}
        <DocumentsIcon
          style={{fontSize: '1.15em', margin: '-3.5px 0', position: 'relative', top: 1.5}}
        />
        {/* A fixed-width, right-aligned number: one- and two-digit counts line up down the menu. */}
        <span
          style={{
            display: 'inline-block',
            fontVariantNumeric: 'tabular-nums',
            minWidth: '2ch',
            textAlign: 'right',
          }}
        >
          {n}
        </span>
      </span>
    </Tooltip>
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
    /** Greyed but clickable: a variant this document has no version of yet (picking it shows the banner's Create version). */
    muted?: boolean
    /** A greyed row's tooltip: why it is greyed ("Not in Black Friday yet"). */
    hint?: string
    /** What search matches an option by (the title is its text when this is left out). */
    search?: Omit<SearchFields, 'title'>
  }[]
  testId: string
  /** The leading glyph, as the stock Published and Draft chips have one: it gives the pill their left inset and size. */
  icon: ReactElement
  /** The perspective in view is one of its entries (a release): marked like the stock chips mark theirs. */
  selected?: boolean
  /** The pill's tone when selected: the Variants pill is purple (suggest), the variant colour, with a variant in view. */
  tone?: 'suggest'
  /** With a choice in view, a cross after the pill clears it (as the navbar chips' cross does), with this accessible name. */
  clear?: {label: string; onClick: () => void}
}) {
  const [query, setQuery] = useState('')
  // Search at the top, always, then the rows in a list that scrolls past 10 rows (the navbar menus' pattern, with no footer).
  const found = rankSearch(props.items, query, (item) => ({title: item.text, ...item.search}))
  const tone = props.selected ? props.tone : undefined
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
          style={{paddingRight: props.clear ? 8 : 11.3}}
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
          <div
            data-testid={`${props.testId}-list`}
            style={{maxHeight: LIST_MAX, overflowY: 'auto'}}
          >
            {found.map(({item, reason}) => (
              <MenuItem
                __unstable_subtitle={reason}
                disabled={!item.onClick}
                icon={item.icon}
                iconRight={item.trailing}
                pressed={item.selected}
                selected={item.selected}
                key={item.key}
                onClick={item.onClick}
                style={item.muted ? {opacity: 0.55} : undefined}
                text={item.text}
                tooltipProps={item.hint ? {content: item.hint, placement: 'left'} : null}
              />
            ))}
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
        borderRadius: 9999,
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
          background: 'var(--card-muted-fg-color)',
          flex: 'none',
          opacity: 0.35,
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
        tone={tone}
      />
      {/* The outline drawn over the segments (so it adds no height): the pill stays the stock chips' 25px. */}
      <span
        aria-hidden
        style={{
          borderRadius: 9999,
          boxShadow: 'inset 0 0 0 1px var(--card-border-color)',
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
  const {selectedPerspectiveName, selectedVariantName} = usePerspective()
  const setVariant = useSetVariant()
  const address = usePerspectiveState()
  const definitions = useVariantDefinitions()
  const schemaType = useSchema().get(documentType)
  const draftsEnabled = useWorkspace().document.drafts.enabled
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
  const current = selectedPerspectiveName ?? 'drafts'
  // Live edit has no draft, and a workspace without the draft model has none either.
  const showDrafts = draftsEnabled && !schemaType?.liveEdit
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
    text: DEFAULT_LABEL,
    icon: <DimensionIcon name={address.dimensions[0]?.name ?? ''} />,
    onClick: () => goTo(current),
    trailing: SHOW_VERSION_COUNT ? <VersionCount versions={baseVersions} /> : undefined,
    selected: !currentVariant,
  }
  // Then every other variant, greyed but clickable: picking one moves the global perspective to it (the version in view kept), where the banner
  // offers Create version (Faheem, 22 Oct). No count: there is no version yet. The open beta stage lists Audience ones only.
  const missingItems = definitions
    .filter((d) => stage !== 'open-beta' || inOpenBeta(d.conditions))
    .filter((d) => !variants.some((v) => v.variantId === d._id.replace(/^_\.variants\./, '')))
    .map((definition) => {
      const id = definition._id.replace(/^_\.variants\./, '')
      const [name] = Object.keys(definition.conditions)
      return {
        key: `variant-missing-${id}`,
        text: definition.metadata?.title ?? id,
        icon: <DimensionIcon name={name ?? address.dimensions[0]?.name ?? ''} />,
        onClick: () => goTo(current, id === currentVariant ? undefined : definition),
        muted: true,
        hint: `No ${definition.metadata?.title ?? id} version yet`,
        selected: id === currentVariant,
        search: {id},
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
    }
  })
  // Then every other active release, greyed but clickable, as the Variants menu lists the variants this document has none of: picking one
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
      muted: true,
      hint: `Not in ${release.metadata.title || 'Untitled release'} yet`,
      selected: current === id,
      search: {id},
    }))
  const releaseCount = new Set(releases.map((v) => v.bundleId)).size
  // The release in view, if any (this document's, or another picked from the greyed rows): the pill names it and gets the cross, as the
  // navbar chip does (Faheem, 22 Oct). The cross goes back to the default version, keeping the variant.
  const inView = [...releaseItems, ...missingReleaseItems].find((item) => item.selected)
  const inViewRelease = activeReleases.find(
    (release) => getReleaseIdFromReleaseDocumentId(release._id) === current,
  )
  const inViewDot = inViewRelease
    ? releaseDot({
        state:
          inViewRelease.metadata.releaseType === 'scheduled'
            ? 'scheduled'
            : inViewRelease.metadata.releaseType === 'asap'
              ? 'asap'
              : 'undecided',
      } as AudienceVersion)
    : undefined
  const hasEarlierGroup = variants.length > 0

  return (
    // It replaces the stock pills in the pane header (PROPOSED slot), so it takes the header's own row, no border.
    <Flex
      align="center"
      data-testid="doc-pills-a"
      gap={2}
      style={{flex: '1 1 0%', minWidth: 0}}
      wrap="wrap"
    >
      {variants.length ? (
        <DropdownPill
          icon={<RhombusIcon />}
          clear={
            viewedTitle
              ? {label: `Back to ${DEFAULT_LABEL}`, onClick: () => goTo(current)}
              : undefined
          }
          items={[baseItem, ...variantItems, ...missingItems]}
          // A variant of this document is in view (in whatever Published, Draft or release): marked like the Releases pill marks a release.
          selected={Boolean(viewedTitle)}
          testId="pills-variants"
          // With a variant of this document in view the pill names it, in purple (Faheem, 22 Oct); otherwise it counts the variants.
          text={viewedTitle ?? `Variants · ${variantGroups.length}`}
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
          icon={<ReleaseAvatarIcon release="published" />}
          mode="ghost"
          onClick={() => goTo('published', viewedDefinition)}
          // Both axes apply: the version in view is selected as well as the Variants pill naming the variant.
          selected={current === 'published'}
          text="Published"
        />
      ) : null}
      {showDrafts ? (
        <Chip
          data-testid="pills-drafts"
          icon={<ReleaseAvatarIcon release="drafts" />}
          mode="ghost"
          onClick={() => goTo('drafts', viewedDefinition)}
          selected={current === 'drafts'}
          text="Draft"
        />
      ) : null}
      {releases.length ? (
        <DropdownPill
          clear={
            inView
              ? {label: 'Leave release', onClick: () => goTo(defaultVersion, viewedDefinition)}
              : undefined
          }
          // The release in view, else the first one, as a dot (its menu rows keep the type icon).
          icon={
            inViewDot ?? releaseDot(releases.find((v) => v.bundleId === current) ?? releases[0])
          }
          items={[...releaseItems, ...missingReleaseItems]}
          // Any release in view, this document's or another (picked from the greyed rows).
          selected={current !== 'published' && current !== 'drafts'}
          testId="pills-releases"
          text={inView?.text ?? `Releases · ${releaseCount}`}
        />
      ) : null}
      {manage}
    </Flex>
  )
}
