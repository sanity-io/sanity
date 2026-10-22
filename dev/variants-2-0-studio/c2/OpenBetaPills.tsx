import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
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
}) {
  const [query, setQuery] = useState('')
  // Search at the top, always, then the rows in a list that scrolls past 10 rows (the navbar menus' pattern, with no footer).
  const found = rankSearch(props.items, query, (item) => ({title: item.text, ...item.search}))
  return (
    <MenuButton
      button={
        <Chip
          data-testid={props.testId}
          icon={props.icon}
          iconRight={ChevronDownIcon}
          mode="ghost"
          // The chevron's glyph sits 0.7px inside its box: the right inset is taken to the glyph, so it ends 12px from the edge like the
          // stock chips' text does.
          paddingRight={0}
          selected={props.selected}
          tone={props.selected ? props.tone : undefined}
          style={{paddingRight: 11.3}}
          text={props.text}
        />
      }
      id={props.testId}
      menu={
        <Menu data-testid={`${props.testId}-menu`} padding={1} style={{minWidth: 240}}>
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
  const showPublished = Boolean(published) || (!showDrafts && !releases.length)

  const currentVariant = selectedVariantName?.replace(/^_\.variants\./, '')
  // Every pill is a proxy for the navbar: ONE navigation sets the version and the router's variant param together, as the navbar toggle and the
  // inventory do (in the open beta that param is the only copy of the choice). A base pill clears the variant, so it shows the base document.
  const goTo = (perspective: ReleaseId, definition?: (typeof definitions)[number]) => {
    const id = definition?._id
    setVariant({variantId: id && isVariantId(id) ? id : undefined, perspective})
    address.setChosen(definition ? definition.conditions : {})
  }
  const definitionOf = (v: AudienceVersion) =>
    definitions.find((d) => d._id.replace(/^_\.variants\./, '') === v.variantId)
  // One selected pill: Variants while a variant is chosen, else the base pill whose version is in view.
  const baseInView = !currentVariant
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
      onClick: v.variantId && !definition ? undefined : () => goTo(current, definition),
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
        onClick: () => goTo(current, definition),
        muted: true,
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
      onClick: () => goTo(bundleId),
      selected: baseInView && current === bundleId,
      search: {id: bundleId},
    }
  })
  // Then every other active release, greyed but clickable, as the Variants menu lists the variants this document has none of: picking one
  // moves to that release and KEEPS the variant in view, where the T6 banner offers Create version (or, for a locked or scheduled release, says
  // so with no button, as it already does).
  const viewedDefinition = definitions.find(
    (d) => d._id.replace(/^_\.variants\./, '') === currentVariant,
  )
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
      onClick: () => goTo(id, viewedDefinition),
      muted: true,
      selected: current === id,
      search: {id},
    }))
  const releaseCount = new Set(releases.map((v) => v.bundleId)).size
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
          onClick={() => goTo('published')}
          selected={baseInView && current === 'published'}
          text="Published"
        />
      ) : null}
      {showDrafts ? (
        <Chip
          data-testid="pills-drafts"
          icon={<ReleaseAvatarIcon release="drafts" />}
          mode="ghost"
          onClick={() => goTo('drafts')}
          selected={baseInView && current === 'drafts'}
          text="Draft"
        />
      ) : null}
      {releases.length ? (
        <DropdownPill
          // The release in view, else the first one, as a dot (its menu rows keep the type icon).
          icon={releaseDot(releases.find((v) => v.bundleId === current) ?? releases[0])}
          items={[...releaseItems, ...missingReleaseItems]}
          selected={baseInView && releases.some((v) => v.bundleId === current)}
          testId="pills-releases"
          text={`Releases · ${releaseCount}`}
        />
      ) : null}
      {manage}
    </Flex>
  )
}
