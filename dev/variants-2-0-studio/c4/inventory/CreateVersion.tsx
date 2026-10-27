import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {DocumentIcon} from '@sanity/icons/Document'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {PackageIcon} from '@sanity/icons/Package'
import {Badge, Box, Button as UIButton, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider} from '@sanity/ui/menu'
import {
  createContext,
  Fragment,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {createPortal} from 'react-dom'
import {getTargetDocument, ReleaseAvatarIcon, useDocumentVersions, usePerspective} from 'sanity'

import {isReleaseScheduledOrScheduling} from '../../../../packages/sanity/src/core/releases/util/util'
import {isCardinalityOneRelease} from '../../../../packages/sanity/src/core/util/releaseUtils'
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {Tooltip} from '../../../../packages/sanity/src/ui-components/tooltip/Tooltip'
import {DimensionIcon} from '../../c1/dimensionIcons'
import {rankSearch, SEARCH_FROM} from '../../c1/search'
import {bannerOffersCreate, useBannerDecision} from '../../c7/useBannerCase'
import {useCreateVariantVersion} from '../../data/useCreateVariantVersion'
import {type InventoryEntry, type InventoryWorld} from './fixtures'

// T4 "Create version" (OPEN-BETA-HANDOFF-SCOPE, T4; Figma C4 "Create version: the chosen pattern"), live. Mirrors the Storybook reference
// (sanity-studio-storybook, handoff/variants-2-0-t4 @ 0394ccbcbf, AddVariantExploration.tsx) against the live inventory world. None of Andrej's files
// is edited: the controls are portalled into his toolbar, his list and his group headers, found by test id.
//
// Create version is a MODE. The toolbar's button turns the toolbar row into the block: the Views menu and the button leave, and the list is pushed
// down. Three rows of a two-column table (Variant definition, Bundle, Document), settable in any order, then Cancel and the commit. While the mode
// is on the groups collapse to their headers with counts and a dimmed preview row sits under the target group. A + on a group header opens the same
// block with the step that group fixes shown as a fact.

/** The version a copy starts from by default: the variant's own, else the base's; a draft first. */
function nearestOf(world: InventoryWorld, variantId: string | undefined) {
  const own = variantId ? world.entries.filter((e) => e.variantId === variantId) : []
  const pool = own.length ? own : world.entries.filter((e) => !e.variantId)
  return (
    pool.find((e) => e.group === 'drafts') ?? pool.find((e) => e.group === 'published') ?? pool[0]
  )
}

export interface VariantChoice {
  /** The short id: `_id` without `_.variants.`. */
  id: string
  title: string
  dimension: string
  value: string
  /** The value's title, which search shows as the reason ("Matches audience: First-time visitors"); the slug when it has none. */
  valueTitle?: string
}

type Dest =
  | {kind: 'drafts'}
  | {kind: 'release'; name: string; title: string; type: string; when: string}

/** A release choice's quiet second line: when it publishes ("Nov 28, 10:00"), "ASAP", or "No date" for an undecided release. */
const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const publishWhen = (type: string, at: string | undefined) =>
  type === 'asap' ? 'ASAP' : at ? DATE_FORMAT.format(new Date(at)) : 'No date'

const releaseDest = (r: InventoryWorld['releases'][number]): Dest => {
  const type = r.metadata?.releaseType ?? 'undecided'
  return {
    kind: 'release',
    name: r.name,
    title: r.metadata?.title || r.name,
    type,
    when: publishWhen(type, r.metadata?.intendedPublishAt),
  }
}

const destGroup = (d: Dest) => (d.kind === 'drafts' ? 'drafts' : d.name)
const destTitle = (d: Dest) => (d.kind === 'drafts' ? 'Drafts' : d.title)

interface Draft {
  /** `undefined`: the base document, for all visitors. */
  variantId: string | undefined
  dest: Dest
  /** `nearest`, or the key of the version chosen. */
  source: string
  /** Whether the editor has chosen anything yet: an address that exists by default is not announced until then. */
  picked: boolean
}

/** What a + on a group header fixes: the bundle, or the variant. */
interface Fixed {
  dest?: Dest
  variantId?: string
  /** The workflow stage of the group a + was pressed on (Drafts only). */
  stage?: 'draft' | 'inReview' | 'approved'
}

const DRAFTS: Dest = {kind: 'drafts'}

/** A prefilled start (T6 banner "Create version"): who sees the version and the bundle it goes in; the document stays Nearest version. */
export interface CreatePreset {
  variantId: string
  /** `drafts`, or a release name. */
  bundle: string
}
const requests = new Map<string, CreatePreset>()
/** Asks the inventory of a document to open in Create version mode, prefilled. It is read when the inventory mounts; it never creates. */
export function requestCreateVersion(documentId: string, preset: CreatePreset) {
  requests.set(documentId, preset)
}

/** The inspector the inventory opens in (c4/InventoryInspector.tsx). */
export const INVENTORY_INSPECTOR = 'variants-inventory'

const modeRequests = new Set<string>()
/**
 * Asks the inventory of a document to open in Create version mode, as its toolbar's Create version opens it (the document menu's Add variant,
 * 27 Oct, Faheem). It is read when the inventory mounts, which is once the document's versions are known; it never creates.
 */
export function requestCreateMode(documentId: string) {
  modeRequests.add(documentId)
}

/** The releases a new version can go in or not (archived and published ones, and scheduled drafts, are left out), and the open destinations. */
function destinationsOf(world: InventoryWorld, draftsEnabled: boolean) {
  const listed = world.releases.filter(
    (r) =>
      !['archived', 'archiving', 'published', 'publishing'].includes(r.state ?? '') &&
      !isCardinalityOneRelease(r),
  )
  const openReleases: Dest[] = listed
    .filter((r) => !isReleaseScheduledOrScheduling(r))
    .map(releaseDest)
  const lockedReleases: Dest[] = listed.filter(isReleaseScheduledOrScheduling).map(releaseDest)
  const destinations: Dest[] = [...(draftsEnabled ? [DRAFTS] : []), ...openReleases]
  return {openReleases, lockedReleases, destinations}
}

/**
 * Where the block starts. From the toolbar (nothing fixed), with a variant chosen that this document has no version of in the Drafts or open
 * release in view: on that address, so Create version is one click (Faheem, 22 Oct). Otherwise Base in the first destination.
 */
function startDraft(
  fixed: Fixed,
  at: {
    world: InventoryWorld
    variants: readonly VariantChoice[]
    destinations: Dest[]
    viewedVariant: string | undefined
    viewedGroup: string
  },
): Draft {
  const {world, variants, destinations, viewedVariant, viewedGroup} = at
  const viewedDest = destinations.find((d) => destGroup(d) === viewedGroup)
  const startsOnView =
    !fixed.variantId &&
    !fixed.dest &&
    viewedVariant !== undefined &&
    viewedDest !== undefined &&
    variants.some((v) => v.id === viewedVariant) &&
    !world.entries.some((e) => e.group === viewedGroup && e.variantId === viewedVariant)
  return {
    variantId: startsOnView ? viewedVariant : fixed.variantId,
    dest: startsOnView ? viewedDest : (fixed.dest ?? destinations[0] ?? DRAFTS),
    source: 'nearest',
    picked: false,
  }
}

/** Collapses every open group to its header and counts its rows; returns the counts and the groups it closed. */
function collapseGroups(frame: HTMLElement | null) {
  const counts: Record<string, number> = {}
  const closed: string[] = []
  for (const header of frame?.querySelectorAll<HTMLElement>('.inventory-group') ?? []) {
    const id = groupId(header)
    counts[id] =
      header.parentElement?.querySelectorAll('[data-testid^="inventory-row-"]').length ?? 0
    if (header.getAttribute('aria-expanded') === 'true') {
      closed.push(id)
      header.click()
    }
  }
  return {counts, closed}
}
const BASE_LABEL = 'Base · all visitors'
/** A definition's hint when it already has a version where Add to points: what exists, not an action (choosing it only selects it). */
const alreadyIn = (d: Dest) => `In ${destTitle(d)} already`

const matches = (query: string, text: string) =>
  !query.trim() || text.toLowerCase().includes(query.trim().toLowerCase())

// Pills hug their content and sit at the start of the column; one wider than the column ends with an ellipsis and says the whole of it on hover.
const PILL = {
  alignSelf: 'flex-start',
  borderRadius: 999,
  maxWidth: '100%',
  width: 'max-content',
} as const

/**
 * A glyph in a slot as wide as what it paints. Studio icons draw into a 25-unit box with different margins (the diamond fills half of it, the
 * drafts dot a sixth), so a fixed icon box gives every pill a different inset and gap. Sized to the painted glyph, every pill has the same 11px
 * inset, 8px gap and chevron inset. Measured once per glyph in a layout effect, written to the slot's style (no state).
 */
function Glyph(props: {children: ReactNode; glyphKey: string}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const {glyphKey} = props
  useLayoutEffect(() => {
    const slot = ref.current
    if (!slot || !glyphKey) return
    const rects = [...slot.querySelectorAll('path, circle, rect, ellipse, polygon')]
      .map((shape) => shape.getBoundingClientRect())
      .filter((rect) => rect.width > 0)
    if (!rects.length) return
    const width = Math.max(...rects.map((r) => r.right)) - Math.min(...rects.map((r) => r.left))
    slot.style.width = `${Math.round(width * 2) / 2}px`
  }, [glyphKey])
  return (
    <span data-pill-glyph="" ref={ref}>
      <Text size={1}>{props.children}</Text>
    </span>
  )
}

const MenuOpenContext = createContext<(open: boolean) => void>(() => undefined)

/** One dropdown: a round pill that opens ONE menu with a search field, kept inside the panel, flipping when it needs to. */
function PillMenu(props: {
  testId: string
  text: string
  searchLabel: string
  /** A menu with more than three options has a search field. */
  searchable: boolean
  icon?: ReactNode
  /** What the icon is, so its slot is measured again when it changes (the text alone may not change with it). */
  glyphKey?: string
  boundary: HTMLElement | null
  children: (query: string) => ReactNode
}) {
  const setOpen = useContext(MenuOpenContext)
  const [query, setQuery] = useState('')
  return (
    <MenuButton
      button={
        // The content is laid out here, not by the Button's icon and text props: see Glyph.
        <UIButton
          data-add-pill=""
          data-testid={props.testId}
          mode="ghost"
          padding={0}
          radius="full"
          style={PILL}
          title={props.text}
        >
          <Flex align="center" data-pill-row="">
            {props.icon ? (
              <Glyph glyphKey={props.glyphKey ?? props.text}>{props.icon}</Glyph>
            ) : null}
            <Box data-pill-text="" flex={1}>
              <Text size={1} textOverflow="ellipsis">
                {props.text}
              </Text>
            </Box>
            <Glyph glyphKey="chevron">
              <ChevronDownIcon />
            </Glyph>
          </Flex>
        </UIButton>
      }
      id={props.testId}
      menu={
        <Menu data-testid={`${props.testId}-menu`} style={{minWidth: 240}}>
          {props.searchable ? (
            <Box padding={1}>
              <TextInput
                aria-label={props.searchLabel}
                data-testid={`${props.testId}-search`}
                fontSize={1}
                // The menu would take typing for its own keys; only the arrows are its.
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    // The menu does not hear an Escape typed in the search field: close it from its pill.
                    event.preventDefault()
                    event.stopPropagation()
                    event.currentTarget.ownerDocument
                      .querySelector<HTMLElement>(`[data-testid="${props.testId}"]`)
                      ?.click()
                    return
                  }
                  if (!['ArrowDown', 'ArrowUp'].includes(event.key)) event.stopPropagation()
                }}
                onChange={(event) => setQuery(event.currentTarget.value)}
                placeholder={props.searchLabel}
                value={query}
              />
            </Box>
          ) : null}
          {props.children(props.searchable ? query : '')}
        </Menu>
      }
      onClose={() => {
        setQuery('')
        setOpen(false)
      }}
      onOpen={() => setOpen(true)}
      popover={{
        constrainSize: true,
        fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
        floatingBoundary: props.boundary,
        placement: 'bottom-start',
        portal: true,
        preventOverflow: true,
      }}
    />
  )
}

function Item(props: {
  id: string
  text: string
  sub?: string
  icon?: ReactNode
  disabled?: boolean
  selected?: boolean
  /** The option already has a version in the chosen bundle: dimmed. Choosing it selects it, and the commit becomes Open existing version. */
  had?: unknown
  onClick?: () => void
}) {
  return (
    <MenuItem
      __unstable_subtitle={props.sub}
      style={props.had ? {opacity: 0.55} : undefined}
      data-testid={props.id}
      disabled={props.disabled}
      icon={props.icon as never}
      onClick={props.onClick}
      selected={props.selected}
      text={props.text}
    />
  )
}

/**
 * A row of the two-column table (Figma C4, Create version): a grid of the icon (25px), the title with its meaning (one line each) and the control.
 * The columns are fixed, so every row's icon, text and pill start on the same edges; the pill takes the remaining width and ends a long value with
 * an ellipsis only after using it. The icon and the pill are centred on the two-line text block.
 */
function TableRow(props: {
  icon: ReactNode
  title: string
  meaning: string
  testId: string
  children: ReactNode
}) {
  const id = props.testId
  return (
    <div data-create-row="" data-testid={id}>
      <div data-create-icon-box="">
        <span data-create-icon="">{props.icon}</span>
      </div>
      {/* Plain line boxes, not two cap-trimmed Texts: the title and its meaning keep an even rhythm when either wraps. */}
      <div data-create-label="" data-testid={`${id}-left`}>
        <div data-create-title="" data-testid={`${id}-title`}>
          {props.title}
        </div>
        <div data-create-meaning="">{props.meaning}</div>
      </div>
      <Stack data-create-controls="" data-testid={`${id}-controls`} gap={2}>
        {props.children}
      </Stack>
    </div>
  )
}

/**
 * The variant tone's diamond, drawn to fill its 25-unit box as the Studio icons do (the temporary Rhombus glyph fills only a third of it), so it
 * sits at 1em like the package and documents icons in a row, a pill or a menu item, with no size correction around it.
 */
const VariantDiamond = () => (
  <svg
    data-diamond=""
    // Sanity UI centres an icon in a cap-trimmed Text line by this attribute, as it does every @sanity/icons icon.
    data-sanity-icon="diamond"
    fill="none"
    height="1em"
    style={{color: 'var(--card-badge-suggest-icon-color)'}}
    viewBox="0 0 25 25"
    width="1em"
  >
    <path
      d="M12.5 4.75L20.25 12.5L12.5 20.25L4.75 12.5Z"
      fill="currentColor"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth={1.5}
    />
  </svg>
)

/**
 * Why the commit became "Open existing version": an "i" beside the pill with the sentence as its tooltip, so the row keeps its height. The same
 * sentence describes the Open existing version button for assistive technology.
 */
function ExistsInfo({text}: {text: string}) {
  return (
    <>
      <Tooltip content={text} placement="top">
        <span aria-label={text} data-testid="add-exists-hint" role="img" tabIndex={0}>
          <Text muted size={1}>
            <InfoOutlineIcon />
          </Text>
        </span>
      </Tooltip>
      <span hidden id="add-exists-description">
        {text}
      </span>
    </>
  )
}

const destIcon = (d: Dest) =>
  d.kind === 'drafts' ? (
    <ReleaseAvatarIcon release="drafts" />
  ) : (
    <ReleaseAvatarIcon
      releaseType={(d.type as 'scheduled' | 'asap' | 'undecided' | undefined) ?? 'undecided'}
    />
  )

// A pill keeps to its column and ends its text with an ellipsis, so a long one never widens the panel. A group header's title takes its count, or
// the current mark, beside it. While the mode is on, the toolbar row (and the bulk bar that replaces it) leaves.
const MODE_CSS = `
[data-create-frame] { container-type: inline-size; }
[data-create-frame][data-mode] [data-testid="inventory-toolbar"],
[data-create-frame][data-mode] [data-testid="inventory-bulk-bar"] { display: none !important; }
/* Group select-all is not offered while a version is being created. */
[data-create-frame][data-mode] .inventory-group .inventory-checkbox { display: none !important; }
/* The table: icon, label and control in fixed columns, so every row starts on the same edges; below 340px the control drops under the label. */
/* The label column fits the longest label on one line (Figma: one line each). Icon, label and pill share the row's centre (Figma C4). */
[data-create-row] { display: grid; grid-template-columns: 25px minmax(0, 128px) minmax(0, 1fr); column-gap: 10px; align-items: center; padding: 12px 16px; }
[data-create-row] > [data-create-controls] { min-width: 0; padding-left: 2px; }
[data-create-icon-box] { width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; overflow: visible; }
[data-create-label], [data-create-head] { min-width: 0; font-family: var(--font-family-text, inherit); }
[data-create-title] { font-size: 13px; line-height: 17px; font-weight: 500; color: var(--card-fg-color); }
[data-create-meaning] { font-size: 12px; line-height: 16px; margin-top: 2px; color: var(--card-muted-fg-color); }
[data-create-head] { padding: 14px 16px 12px; }
[data-create-head-title] { font-size: 13px; line-height: 17px; font-weight: 600; color: var(--card-fg-color); }
[data-create-head-sub] { font-size: 12px; line-height: 16px; margin-top: 3px; color: var(--card-muted-fg-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
[data-create-icon] { display: inline-flex; font-size: 21px; line-height: 0; overflow: visible; }
[data-create-icon] svg { width: 21px; height: 21px; }
@container (max-width: 339px) {
  [data-create-row] { grid-template-columns: 25px minmax(0, 1fr); align-items: start; row-gap: 10px; }
  [data-create-icon-box] { margin-top: -4px; }
  [data-create-row] > [data-create-controls] { grid-column: 2; padding: 0; }
}
/* Pills: 29px tall, 11px to the glyph, 8px to the text, 10px after the chevron. */
[data-create-frame] [data-add-pill] { max-width: 100%; min-width: 0; height: 29px; }
[data-create-frame] [data-pill-row] { height: 29px; padding: 0 10px 0 11px; gap: 8px; min-width: 0; }
[data-create-frame] [data-pill-text] { min-width: 0; }
[data-pill-glyph] { display: inline-flex; justify-content: center; flex: none; overflow: visible; }
[data-create-frame] .inventory-group > div:nth-child(2) { display: flex; align-items: center; gap: 6px; }
/* The title truncates on one line and the counts ("· 2 · 1 new") and the current mark always stay whole after it (Faheem, 22 Oct). */
[data-create-frame] .inventory-group > div:nth-child(2) > :first-child { flex: 0 1 auto; min-width: 0; }
[data-create-frame] .inventory-group [data-testid^="add-count-"],
[data-create-frame] .inventory-group [data-testid="add-current"] { flex: none; white-space: nowrap; }
/* A row with no subtitle renders an empty one (and the stack's gap above it), which pushed its title 5px above the checkbox, badge and
   markers: an empty subtitle takes no room, so a one-line title is centred with them (Faheem, 23 Oct). */
[data-create-frame] [data-testid^="inventory-row-"] [data-ui="Stack"] > [data-ui="Text"]:has(> span > span:empty:only-child) { display: none; }`

const sameElements = (a: readonly HTMLElement[], b: readonly HTMLElement[]) =>
  a.length === b.length && a.every((el, i) => el === b[i])

const groupId = (header: HTMLElement) =>
  header.dataset.testid?.replace('inventory-group-', '') ?? ''

export function CreateVersion(props: {
  /** The published id: a banner's prefilled request is kept by it. */
  documentId: string
  frame: HTMLElement | null
  world: InventoryWorld
  documentTitle: string
  variants: readonly VariantChoice[]
  /** Whether the document has drafts: without them the bundle starts on the first open release. */
  draftsEnabled: boolean
  /** The version was created, and the group that took it: the panel selects it and the global perspective moves to it. */
  onCreate: (entry: InventoryEntry, received: string) => void
  /** The group that took a new version, when the panel was remounted by the move to it: it opens alone and is marked current. */
  received?: string
  /** The group has been shown; it is not asked for again. */
  onReceived: () => void
  /** The version already exists: select it. */
  onOpen: (entry: InventoryEntry) => void
}) {
  const {frame, world, variants, draftsEnabled, onCreate, onOpen, onReceived} = props
  // The one create implementation, shared with the T6 banner.
  const {create, createBaseVersion, status} = useCreateVariantVersion(props.documentId)
  // While the banner case is not known yet, the toolbar shows neither its Create version nor its count (no wrong state on screen).
  const decision = useBannerDecision(props.documentId)
  const bannerCreates = bannerOffersCreate(decision.banner)
  const busy = status === 'creating'
  const {versions: documentVersions} = useDocumentVersions({documentId: props.documentId})
  // What the studio shows: the navbar's variant (short id) and the Drafts or release in view. The toolbar's Create version starts there.
  const {selectedPerspectiveName, selectedVariantName} = usePerspective()
  const viewedVariant = selectedVariantName?.replace(/^_\.variants\./, '')
  const viewedGroup = selectedPerspectiveName ?? 'drafts'
  const variantsOn = variants.length > 0
  const [toolbar, setToolbar] = useState<HTMLElement | null>(null)
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const [headers, setHeaders] = useState<HTMLElement[]>([])
  // Bundles a new version can go in: open releases. A scheduled release is locked, as the Studio locks it: listed in the menu, not a target.
  const {openReleases, lockedReleases, destinations} = destinationsOf(world, draftsEnabled)
  // A banner's "Create version" opens the inventory with the block already open and prefilled (presets, not locks). The document menu's Add
  // variant opens it as the toolbar's Create version does.
  const [mode, setMode] = useState<{fixed: Fixed; draft: Draft} | null>(() => {
    const preset = requests.get(props.documentId)
    if (!preset) {
      if (!modeRequests.has(props.documentId)) return null
      return {
        fixed: {},
        draft: startDraft({}, {world, variants, destinations, viewedVariant, viewedGroup}),
      }
    }
    const release = world.releases.find((r) => r.name === preset.bundle)
    const dest: Dest = release ? releaseDest(release) : DRAFTS
    return {fixed: {}, draft: {variantId: preset.variantId, dest, source: 'nearest', picked: false}}
  })
  // The groups collapse once they are on screen (the block opened before the list did).
  const collapseOnScan = useRef(mode !== null)
  useEffect(() => {
    requests.delete(props.documentId)
    modeRequests.delete(props.documentId)
  }, [props.documentId])
  const [menuOpen, setMenuOpen] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const collapsedByMode = useRef<string[]>([])
  // The preview row's host: one element, moved under the target group's header while the mode is on.
  const [previewHost] = useState(() => document.createElement('div'))
  const pendingGroup = useRef<string | undefined>(props.received)
  const [currentGroup, setCurrentGroup] = useState<string | undefined>(props.received)

  // His toolbar, list and group headers are his own DOM: find them and put the controls in by portal. The block goes in a container placed just above
  // his list, where the toolbar row's content is hidden while the mode is on.
  useEffect(() => {
    if (!frame) return undefined
    const scan = () => {
      const found = frame.querySelector<HTMLElement>('[data-testid="inventory-toolbar"]')
      setToolbar((current) => (current === found ? current : found))
      // The block sits just above the list. A panel without the list's test id (the older copy of his panel in the Design Studio) gets it just
      // after the toolbar row (or its wrapper) instead, which the mode hides: the same place on screen.
      const list = frame.querySelector<HTMLElement>('[data-testid="inventory-list"]')
      const anchor =
        list ??
        (found?.nextElementSibling as HTMLElement | null) ??
        (found?.parentElement?.nextElementSibling as HTMLElement | null) ??
        null
      let container: HTMLElement | null = anchor?.dataset.addSlot !== undefined ? anchor : null
      if (!container && anchor?.parentElement) {
        const before = anchor.previousElementSibling as HTMLElement | null
        container = before?.dataset.addSlot !== undefined ? before : null
        if (!container) {
          container = anchor.ownerDocument.createElement('div')
          container.dataset.addSlot = ''
          container.style.flex = 'none'
          anchor.parentElement.insertBefore(container, anchor)
        }
      }
      setSlot((current) => (current === container ? current : container))
      const groups = [...frame.querySelectorAll<HTMLElement>('.inventory-group')]
      // A header's title truncates beside its counts (MODE_CSS): its full text is its tooltip. The observer watches children only, so
      // setting the attribute does not scan again.
      for (const header of groups) {
        const title = header.children[1]?.firstElementChild as HTMLElement | null | undefined
        const full = title?.textContent ?? ''
        if (title && title.title !== full) title.title = full
      }
      setHeaders((current) => (sameElements(current, groups) ? current : groups))
      if (collapseOnScan.current && groups.length) {
        collapseOnScan.current = false
        const {counts: next, closed} = collapseGroups(frame)
        collapsedByMode.current = closed
        setCounts(next)
      }
    }
    scan()
    const observer = new MutationObserver(scan)
    observer.observe(frame, {childList: true, subtree: true})
    return () => observer.disconnect()
  }, [frame])

  const on = mode !== null
  // The frame says the mode is on, and the scoped style takes the toolbar row away.
  useEffect(() => {
    frame?.toggleAttribute('data-mode', on)
  }, [on, frame])

  // Once the group that received the version is on screen, it is open and every other one is shut.
  useEffect(() => {
    if (!pendingGroup.current || mode) return
    const target = headers.find((h) => groupId(h) === pendingGroup.current)
    if (!target) return
    for (const header of headers) {
      const open = header.getAttribute('aria-expanded') === 'true'
      if ((header === target) !== open) header.click()
    }
    pendingGroup.current = undefined
    onReceived()
  }, [headers, mode, onReceived])

  // Leaving the mode gives the groups back as they were; after a create only the group that received the version opens, and it is marked as current.
  const leave = useCallback(
    (received?: string) => {
      setMode(null)
      setMenuOpen(false)
      setCounts({})
      if (received) {
        setCurrentGroup(received)
        pendingGroup.current = received
      } else {
        for (const id of collapsedByMode.current) {
          const header = frame?.querySelector<HTMLElement>(`[data-testid="inventory-group-${id}"]`)
          if (header?.getAttribute('aria-expanded') === 'false') header.click()
        }
      }
      collapsedByMode.current = []
    },
    [frame, setMenuOpen],
  )
  const cancel = useCallback(() => leave(), [leave])

  // Escape leaves the mode, unless a menu is open: the menu takes the Escape first.
  useEffect(() => {
    if (!mode || menuOpen) return undefined
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && cancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mode, menuOpen, cancel])

  const patch = (next: Partial<Draft>) =>
    setMode((m) => (m ? {...m, draft: {...m.draft, ...next, picked: true}} : m))

  const variantTitle = (id: string | undefined) =>
    id ? (variants.find((v) => v.id === id)?.title ?? id) : 'Base'
  const bundleTitle = (group: string) =>
    group === 'drafts'
      ? 'Drafts'
      : group === 'published'
        ? 'Published'
        : (world.releases.find((r) => r.name === group)?.metadata?.title ?? group)
  const entryLabel = (entry: InventoryEntry) =>
    `${variantTitle(entry.variantId)} · ${bundleTitle(entry.group)}`
  const variantLabel = (id: string | undefined) => (id ? variantTitle(id) : BASE_LABEL)
  const existingOf = (draft: Draft) =>
    world.entries.find((e) => e.group === destGroup(draft.dest) && e.variantId === draft.variantId)

  // ---- the target group's preview row: the group the new version would fall in
  const draftNow = mode?.draft
  const isNew = draftNow ? !existingOf(draftNow) : false
  const targetHeader = (() => {
    if (!draftNow || !isNew) return null
    const ids = headers.map(groupId)
    const dest = destGroup(draftNow.dest)
    const want = ids.includes(dest)
      ? dest
      : ids.includes('stage-draft')
        ? 'stage-draft'
        : variants
            .filter((v) => v.id === draftNow.variantId)
            .map((v) => `${v.dimension}-${v.value}`)
            .find((candidate) => ids.includes(candidate))
    return headers.find((h) => groupId(h) === want) ?? null
  })()
  useEffect(() => {
    if (!targetHeader) return undefined
    targetHeader.insertAdjacentElement('afterend', previewHost)
    return () => previewHost.remove()
  }, [targetHeader, previewHost])

  const sourceEntry = (draft: Draft) => world.entries.find((e) => e.key === draft.source)
  const fromOf = (draft: Draft) =>
    draft.source === 'nearest' ? nearestOf(world, draft.variantId) : sourceEntry(draft)
  const readBack = (draft: Draft) => {
    const from = fromOf(draft)
    return `${variantLabel(draft.variantId)} in ${destTitle(draft.dest)}, from ${from ? entryLabel(from) : 'the nearest version'}`
  }

  /** The stored version a row of the list stands for (its id and revision), found among the document's versions as core finds them. */
  const documentOf = (entry: InventoryEntry | undefined) => {
    if (!entry) return undefined
    const stub = getTargetDocument({
      bundle: entry.group,
      variant: entry.variantId ? `_.variants.${entry.variantId}` : undefined,
      documentVersions,
    })
    return stub ? {_id: stub._id, _rev: stub._rev} : undefined
  }

  // Creates the version, then moves to it (one navigation) and closes the block. While it runs the block is inert and the commit says
  // Creating…; a failure is a toast and the block stays open with its values.
  const commit = async () => {
    if (!mode || busy || existingOf(mode.draft)) return
    const {draft} = mode
    const group = destGroup(draft.dest)
    const picked = draft.source === 'nearest' ? undefined : documentOf(sourceEntry(draft))
    let created = true
    if (draft.variantId) {
      // A variant version: Nearest version is core's base rule; a picked version is sent as the base.
      created = await create({variantId: draft.variantId, perspective: group, base: picked})
    } else if (draft.dest.kind === 'release') {
      // The base document into a release: core's version create, copying the picked version or the nearest base version.
      const base = picked ?? documentOf(nearestOf(world, undefined))
      created = base ? await createBaseVersion(draft.dest.name, base) : false
    }
    // The base document in Drafts needs no create: Drafts is where the base is edited.
    if (!created) return
    const entry: InventoryEntry = {
      key: `${group}:${draft.variantId ?? 'base'}`,
      group,
      variantId: draft.variantId,
      changedFields: fromOf(draft)?.changedFields ?? [],
      updated: '0h ago',
    }
    const received = targetHeader ? groupId(targetHeader) : group
    onCreate(entry, received)
    leave(received)
  }

  // The mode collapses the groups to their headers with a count of their rows.
  const startMode = (fixed: Fixed) => {
    const {counts: next, closed} = collapseGroups(frame)
    collapsedByMode.current = closed
    setCounts(next)
    setCurrentGroup(undefined)
    setMode({
      fixed,
      draft: startDraft(fixed, {world, variants, destinations, viewedVariant, viewedGroup}),
    })
    // No menu opens by itself (Faheem, 22 Oct): the steps show, and the editor chooses. When the default address already exists, the disabled
    // Create version says why in its tooltip.
  }

  // ---- the block
  const block = (current: {fixed: Fixed; draft: Draft}) => {
    const {draft} = current
    const nearest = nearestOf(world, draft.variantId)
    const from = sourceEntry(draft)
    const found = existingOf(draft)
    // The address exists by default (Base in Drafts): Create waits for a new one, and nothing is announced until the editor picks an existing address.
    const existing = draft.picked ? found : undefined
    const waiting = Boolean(found) && !draft.picked
    const variantPick = variants.find((v) => v.id === draft.variantId)
    // A definition that already has a version in the chosen bundle is dimmed. Choosing it sets that address, and the commit becomes "Open existing
    // version" (one menu per pill: the menu itself never opens a version).
    const hasIn = (variantId: string | undefined) =>
      world.entries.find((e) => e.group === destGroup(draft.dest) && e.variantId === variantId)
    const choose = (variantId: string | undefined) => patch({variantId})

    // Whatever the entry point knows (the group a + was pressed on) is only a preset: every row stays a dropdown.
    const variantControl = (
      <PillMenu
        boundary={frame}
        icon={variantPick ? <DimensionIcon name={variantPick.dimension} /> : <VariantDiamond />}
        searchable={variants.length + 1 >= SEARCH_FROM}
        searchLabel="Find a variant definition"
        testId="add-pill-variant"
        text={variantPick?.title ?? BASE_LABEL}
      >
        {(q) => (
          <>
            {matches(q, BASE_LABEL) ? (
              <Item
                had={hasIn(undefined)}
                icon={<VariantDiamond />}
                id="add-value-base"
                sub={hasIn(undefined) ? alreadyIn(draft.dest) : undefined}
                onClick={() => choose(undefined)}
                selected={!draft.variantId}
                text={BASE_LABEL}
              />
            ) : null}
            {rankSearch(variants, q, (v) => ({
              title: v.title,
              condition: {dimension: v.dimension, value: v.valueTitle ?? v.value},
              id: v.id,
            })).map(({item: v, reason}) => (
              <Item
                icon={<DimensionIcon name={v.dimension} />}
                id={`add-value-${v.value}`}
                key={v.id}
                had={hasIn(v.id)}
                onClick={() => choose(v.id)}
                selected={draft.variantId === v.id}
                sub={reason ?? (hasIn(v.id) ? alreadyIn(draft.dest) : undefined)}
                text={v.title}
              />
            ))}
          </>
        )}
      </PillMenu>
    )

    const bundleControl = (
      <PillMenu
        boundary={frame}
        icon={destIcon(draft.dest)}
        searchable={destinations.length + lockedReleases.length >= SEARCH_FROM}
        searchLabel="Find where to add it"
        testId="add-pill-bundle"
        text={destTitle(draft.dest)}
      >
        {(q) => (
          <>
            {rankSearch([...destinations, ...lockedReleases], q, (d) => ({
              title: destTitle(d),
              id: d.kind === 'release' ? d.name : undefined,
            })).map(({item: d, reason}) => {
              // A scheduled release is locked (as the Studio locks it): listed, dimmed, not a target.
              const locked = lockedReleases.includes(d)
              return (
                <Item
                  disabled={locked}
                  icon={destIcon(d)}
                  id={`add-bundle-${destGroup(d)}`}
                  key={destGroup(d)}
                  onClick={locked ? undefined : () => patch({dest: d})}
                  selected={destGroup(d) === destGroup(draft.dest)}
                  sub={
                    reason ??
                    (d.kind === 'release' ? (locked ? `${d.when} · Locked` : d.when) : undefined)
                  }
                  text={destTitle(d)}
                />
              )
            })}
          </>
        )}
      </PillMenu>
    )

    const documentControl = (
      <PillMenu
        boundary={frame}
        icon={<DocumentIcon />}
        searchable={world.entries.length + 1 >= SEARCH_FROM}
        searchLabel="Find a version"
        testId="add-pill-source"
        text={draft.source === 'nearest' || !from ? 'Nearest version' : entryLabel(from)}
      >
        {(q) => (
          <>
            {matches(q, 'Nearest version') ? (
              <Item
                id="add-source-nearest"
                onClick={() => patch({source: 'nearest'})}
                selected={draft.source === 'nearest'}
                sub={nearest ? entryLabel(nearest) : undefined}
                text="Nearest version"
              />
            ) : null}
            <MenuDivider />
            {world.entries
              .filter((e) => matches(q, entryLabel(e)))
              .map((e) => (
                <Item
                  id={`add-source-${e.key}`}
                  key={e.key}
                  onClick={() => patch({source: e.key})}
                  selected={draft.source === e.key}
                  text={entryLabel(e)}
                />
              ))}
          </>
        )}
      </PillMenu>
    )

    const text = readBack(draft)
    return (
      <Card
        aria-busy={busy}
        borderBottom
        borderTop
        data-testid="add-block"
        inert={busy}
        tone="default"
      >
        {/* The header starts on the rows' 16px edge. The subtitle keeps to one line: a long title ends with an ellipsis, and shows whole on hover. */}
        <div data-create-head="">
          <div data-create-head-title="">Create version</div>
          <Tooltip content={`A new version of ${props.documentTitle}`} placement="bottom-start">
            <div data-create-head-sub="" data-testid="add-subtitle">
              A new version of {props.documentTitle}
            </div>
          </Tooltip>
        </div>
        {variantsOn ? (
          <Card borderTop>
            <TableRow
              icon={<VariantDiamond />}
              meaning="Who sees this version"
              testId="add-step-variant"
              title="Variant definition"
            >
              <Flex align="center" gap={2}>
                {variantControl}
                {existing ? (
                  <ExistsInfo
                    text={`${props.documentTitle} already has this version in ${destTitle(draft.dest)}`}
                  />
                ) : null}
              </Flex>
            </TableRow>
          </Card>
        ) : null}
        <Card borderTop>
          <TableRow
            icon={<PackageIcon />}
            meaning="Where it lives"
            testId="add-step-bundle"
            title="Add to"
          >
            <Flex align="center" gap={2}>
              {bundleControl}
              {variantsOn || !existing ? null : (
                <ExistsInfo
                  text={`${props.documentTitle} already has a version in ${destTitle(draft.dest)}`}
                />
              )}
            </Flex>
          </TableRow>
        </Card>
        <Card borderTop>
          <TableRow
            icon={<DocumentsIcon />}
            meaning="What it starts from"
            testId="add-step-document"
            title="Document"
          >
            {documentControl}
          </TableRow>
        </Card>
        <Card borderTop>
          <Flex
            align="center"
            data-testid="add-actions-row"
            justify="flex-end"
            style={{padding: '14px 16px', gap: 12}}
          >
            <Button
              data-testid="add-cancel"
              mode="bleed"
              onClick={cancel}
              text="Cancel"
              tooltipProps={null}
            />
            {existing ? (
              // The version is already there: the commit becomes a way to open it.
              <Button
                aria-describedby="add-exists-description"
                data-testid="add-open-existing"
                mode="ghost"
                onClick={() => {
                  onOpen(existing)
                  cancel()
                }}
                text="Open existing version"
                tooltipProps={null}
              />
            ) : (
              <>
                <span
                  data-testid="add-commit-description"
                  id="add-commit-description"
                  style={{display: 'none'}}
                >
                  {text}
                </span>
                {waiting ? (
                  // Disabled from the start because the default address exists: the tooltip says why. A disabled button takes no hover, so
                  // the tooltip is on a wrapper.
                  <Tooltip
                    content={`${variantLabel(draft.variantId)} already has a version in ${destTitle(draft.dest)}. Choose another variant or Add to.`}
                    placement="top"
                  >
                    <span data-testid="add-commit-why" style={{display: 'inline-flex'}}>
                      <Button
                        aria-describedby="add-commit-description"
                        data-testid="add-commit"
                        disabled
                        mode="default"
                        text="Create version"
                        tone="primary"
                        tooltipProps={null}
                      />
                    </span>
                  </Tooltip>
                ) : (
                  <Button
                    aria-describedby="add-commit-description"
                    data-testid="add-commit"
                    disabled={busy}
                    mode="default"
                    onClick={() => void commit()}
                    text={busy ? 'Creating…' : 'Create version'}
                    tone="primary"
                    tooltipProps={busy ? null : {content: text}}
                  />
                )}
              </>
            )}
          </Flex>
        </Card>
      </Card>
    )
  }

  // ---- the portals
  // While the T6 banner offers its own Create version, the toolbar's steps aside: one on screen (22 Oct call). Without a banner it shows.
  const toolbarButton =
    toolbar &&
    !decision.pending &&
    !bannerCreates &&
    createPortal(
      <Box data-add-anchor="" style={{flex: 'none'}}>
        <Button
          data-testid="add-toolbar-button"
          mode="default"
          onClick={() => startMode({})}
          text="Create version"
          tone="primary"
          tooltipProps={null}
        />
      </Box>,
      toolbar,
    )

  const groupButtons = headers.map((header) => {
    const id = groupId(header)
    const release = openReleases.find((d) => d.kind === 'release' && d.name === id)
    const locked = lockedReleases.some((d) => d.kind === 'release' && d.name === id)
    // By publish date's Drafts group is `drafts`; By stage's are `stage-…` (kept for the Design Studio's other views).
    const isDrafts = id === 'drafts' || (id.startsWith('stage-') && id !== 'stage-published')
    const variant = variants.find((v) => id === `${v.dimension}-${v.value}`)
    const askable = Boolean(release || (isDrafts && draftsEnabled) || (variant && variantsOn))
    return (
      <Fragment key={id}>
        {createPortal(
          <Box data-add-anchor="" style={{flex: 'none'}}>
            <Button
              aria-label={
                askable
                  ? 'Create version in this group'
                  : locked
                    ? 'Scheduled releases are locked'
                    : 'This group takes no new version'
              }
              data-testid={`add-group-${id}`}
              disabled={!askable}
              icon={AddIcon}
              mode="bleed"
              onClick={(event: {stopPropagation: () => void}) => {
                event.stopPropagation()
                const stage = id.replace('stage-', '')
                startMode(
                  release
                    ? {dest: release}
                    : variant
                      ? {variantId: variant.id}
                      : {
                          dest: DRAFTS,
                          stage:
                            stage === 'inReview' || stage === 'approved'
                              ? stage
                              : ('draft' as const),
                        },
                )
              }}
              tooltipProps={{
                content: askable
                  ? 'Create version here'
                  : locked
                    ? 'Scheduled releases are locked'
                    : 'Takes no new version',
              }}
            />
          </Box>,
          header,
        )}
      </Fragment>
    )
  })

  // While the mode is on each header names its row count; the target group also its new version.
  const countLabels = on
    ? headers.map((header) => {
        const id = groupId(header)
        const titleBox = header.children[1] as HTMLElement | undefined
        if (!titleBox || counts[id] === undefined) return null
        return (
          <Fragment key={id}>
            {createPortal(
              <Text data-testid={`add-count-${id}`} muted size={1}>
                · {counts[id]}
                {header === targetHeader ? ' · 1 new' : ''}
              </Text>,
              titleBox,
            )}
          </Fragment>
        )
      })
    : null

  const currentMarks = !on
    ? headers
        .filter((header) => groupId(header) === currentGroup)
        .map((header) => {
          const titleBox = header.children[1] as HTMLElement | undefined
          if (!titleBox) return null
          return (
            <Fragment key={`current-${currentGroup}`}>
              {createPortal(
                <Badge data-testid="add-current" fontSize={0} radius={2} tone="primary">
                  Current
                </Badge>,
                titleBox,
              )}
            </Fragment>
          )
        })
    : null

  const previewRow = (draft: Draft) => (
    <Card
      data-testid="add-preview"
      padding={3}
      style={{opacity: 0.6, borderBottom: '1px dashed var(--card-border-color)'}}
      tone="default"
    >
      <Stack gap={2}>
        <Text size={1}>{variantLabel(draft.variantId)}</Text>
        <Text muted size={1}>
          New · copied from{' '}
          {fromOf(draft)
            ? `the nearest version (${entryLabel(fromOf(draft)!)})`
            : 'the nearest version'}
        </Text>
      </Stack>
    </Card>
  )

  return (
    <MenuOpenContext.Provider value={setMenuOpen}>
      <style>{MODE_CSS}</style>
      {toolbarButton}
      {groupButtons}
      {countLabels}
      {currentMarks}
      {slot && mode ? createPortal(block(mode), slot) : null}
      {targetHeader && draftNow && isNew ? createPortal(previewRow(draftNow), previewHost) : null}
      {menuOpen ? (
        <div
          data-testid="add-scrim"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            background: 'rgba(0, 0, 0, 0.45)',
          }}
        />
      ) : null}
    </MenuOpenContext.Provider>
  )
}
