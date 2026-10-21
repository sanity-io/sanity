import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {PackageIcon} from '@sanity/icons/Package'
import {Badge, Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider} from '@sanity/ui/menu'
import {
  createContext,
  Fragment,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {createPortal} from 'react-dom'
import {ReleaseAvatarIcon} from 'sanity'

import {RhombusIcon} from '../../../../packages/sanity/src/core/components/temporary-icons/Rhombus'
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {DimensionIcon} from '../../c1/dimensionIcons'
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
}

type Dest = {kind: 'drafts'} | {kind: 'release'; name: string; title: string; type: string}

const destGroup = (d: Dest) => (d.kind === 'drafts' ? 'drafts' : d.name)
const destTitle = (d: Dest) => (d.kind === 'drafts' ? 'Drafts' : d.title)

interface Draft {
  /** `undefined`: the base document, for all visitors. */
  variantId: string | undefined
  dest: Dest
  /** `nearest`, or the key of the version chosen. */
  source: string
}

/** What a + on a group header fixes: the bundle, or the variant. */
interface Fixed {
  dest?: Dest
  variantId?: string
}

const DRAFTS: Dest = {kind: 'drafts'}
const BASE_LABEL = 'Base · all visitors'

const matches = (query: string, text: string) =>
  !query.trim() || text.toLowerCase().includes(query.trim().toLowerCase())

// Loose padding: the pill is as tall as a toolbar button and takes 12px at the sides.
const PILL = {borderRadius: 999, paddingInline: 12} as const

const MenuOpenContext = createContext<(open: boolean) => void>(() => undefined)

/** One dropdown: a round pill that opens ONE menu with a search field, kept inside the panel, flipping when it needs to. */
function PillMenu(props: {
  testId: string
  text: string
  searchLabel: string
  icon?: ReactNode
  boundary: HTMLElement | null
  children: (query: string) => ReactNode
}) {
  const setOpen = useContext(MenuOpenContext)
  const [query, setQuery] = useState('')
  return (
    <MenuButton
      button={
        <Button
          data-add-pill=""
          data-testid={props.testId}
          icon={props.icon as never}
          iconRight={ChevronDownIcon}
          mode="ghost"
          style={PILL}
          text={props.text}
          tooltipProps={null}
        />
      }
      id={props.testId}
      menu={
        <Menu data-testid={`${props.testId}-menu`} style={{minWidth: 240}}>
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
          {props.children(query)}
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
  onClick?: () => void
}) {
  return (
    <MenuItem
      __unstable_subtitle={props.sub}
      data-testid={props.id}
      disabled={props.disabled}
      icon={props.icon as never}
      onClick={props.onClick}
      selected={props.selected}
      text={props.text}
    />
  )
}

/** A row of the two-column table: an icon in a 25px gutter, the title and its meaning on the same edge, the control on the right. */
function TableRow(props: {
  icon: ReactNode
  title: string
  meaning: string
  testId: string
  children: ReactNode
}) {
  const id = props.testId
  return (
    <Flex align="flex-start" data-testid={id} gap={3} padding={3}>
      <Flex
        align="flex-start"
        data-testid={`${id}-left`}
        gap={2}
        style={{width: 140, flex: 'none'}}
      >
        <Flex align="center" justify="center" style={{width: 25, flex: 'none', height: 25}}>
          <Text size={1}>{props.icon}</Text>
        </Flex>
        <Stack flex={1} gap={1} style={{paddingTop: 2}}>
          <Text data-testid={`${id}-title`} size={1} weight="medium">
            {props.title}
          </Text>
          <Text muted size={0}>
            {props.meaning}
          </Text>
        </Stack>
      </Flex>
      <Stack data-testid={`${id}-controls`} flex={1} gap={2} style={{minWidth: 0}}>
        {props.children}
      </Stack>
    </Flex>
  )
}

const VariantDiamond = () => (
  <span style={{display: 'inline-flex', color: 'var(--card-badge-suggest-icon-color)'}}>
    <RhombusIcon />
  </span>
)

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
[data-create-frame][data-mode] [data-testid="inventory-toolbar"],
[data-create-frame][data-mode] [data-testid="inventory-bulk-bar"] { display: none !important; }
[data-create-frame] [data-add-pill] { max-width: 100%; min-width: 0; }
[data-create-frame] [data-add-pill] [data-ui="Text"] { min-width: 0; }
[data-create-frame] [data-add-pill] [data-ui="Text"] > span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-block: 3px; margin-block: -3px; }
[data-create-frame] .inventory-group > div:nth-child(2) { display: flex; align-items: center; gap: 6px; }`

const sameElements = (a: readonly HTMLElement[], b: readonly HTMLElement[]) =>
  a.length === b.length && a.every((el, i) => el === b[i])

const groupId = (header: HTMLElement) =>
  header.dataset.testid?.replace('inventory-group-', '') ?? ''

export function CreateVersion(props: {
  frame: HTMLElement | null
  world: InventoryWorld
  documentTitle: string
  variants: readonly VariantChoice[]
  /** Whether the document has drafts: without them the bundle starts on the first open release. */
  draftsEnabled: boolean
  /** The new version and the group that took it: the panel selects it and the global perspective moves to it. */
  onCreate: (entry: InventoryEntry, received: string) => void
  /** The group that took a new version, when the panel was remounted by the move to it: it opens alone and is marked current. */
  received?: string
  /** The group has been shown; it is not asked for again. */
  onReceived: () => void
  /** The version already exists: select it. */
  onOpen: (entry: InventoryEntry) => void
}) {
  const {frame, world, variants, draftsEnabled, onCreate, onOpen, onReceived} = props
  const variantsOn = variants.length > 0
  const [toolbar, setToolbar] = useState<HTMLElement | null>(null)
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const [headers, setHeaders] = useState<HTMLElement[]>([])
  const [mode, setMode] = useState<{fixed: Fixed; draft: Draft} | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const collapsedByMode = useRef<string[]>([])
  // The preview row's host: one element, moved under the target group's header while the mode is on.
  const [previewHost] = useState(() => document.createElement('div'))
  const pendingGroup = useRef<string | undefined>(props.received)
  const [currentGroup, setCurrentGroup] = useState<string | undefined>(props.received)

  const openReleases: Dest[] = world.releases
    .filter((r) => r.state !== 'archived' && r.state !== 'published')
    .map((r) => ({
      kind: 'release',
      name: r.name,
      title: r.metadata?.title || r.name,
      type: r.metadata?.releaseType ?? 'undecided',
    }))
  const destinations: Dest[] = [...(draftsEnabled ? [DRAFTS] : []), ...openReleases]
  const startDest = destinations[0] ?? DRAFTS

  // His toolbar, list and group headers are his own DOM: find them and put the controls in by portal. The block goes in a container placed just above
  // his list, where the toolbar row's content is hidden while the mode is on.
  useEffect(() => {
    if (!frame) return undefined
    const scan = () => {
      const found = frame.querySelector<HTMLElement>('[data-testid="inventory-toolbar"]')
      setToolbar((current) => (current === found ? current : found))
      const list = frame.querySelector<HTMLElement>('[data-testid="inventory-list"]')
      let container: HTMLElement | null = null
      if (list?.parentElement) {
        const before = list.previousElementSibling as HTMLElement | null
        container = before?.dataset.addSlot !== undefined ? before : null
        if (!container) {
          container = list.ownerDocument.createElement('div')
          container.dataset.addSlot = ''
          container.style.flex = 'none'
          list.parentElement.insertBefore(container, list)
        }
      }
      setSlot((current) => (current === container ? current : container))
      const groups = [...frame.querySelectorAll<HTMLElement>('.inventory-group')]
      setHeaders((current) => (sameElements(current, groups) ? current : groups))
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
    [frame],
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
    setMode((m) => (m ? {...m, draft: {...m.draft, ...next}} : m))

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

  const commit = () => {
    if (!mode || existingOf(mode.draft)) return
    const {draft} = mode
    const group = destGroup(draft.dest)
    const entry: InventoryEntry = {
      key: `${group}:${draft.variantId ?? 'base'}`,
      group,
      variantId: draft.variantId,
      changedFields: fromOf(draft)?.changedFields ?? [],
      updated: '0h ago',
      ...(draft.dest.kind === 'drafts' ? {stage: 'draft' as const} : {}),
    }
    const received = targetHeader ? groupId(targetHeader) : group
    onCreate(entry, received)
    leave(received)
  }

  // The mode collapses the groups to their headers with a count of their rows.
  const startMode = (fixed: Fixed) => {
    const found = [...(frame?.querySelectorAll<HTMLElement>('.inventory-group') ?? [])]
    const next: Record<string, number> = {}
    const open: string[] = []
    for (const header of found) {
      const id = groupId(header)
      next[id] =
        header.parentElement?.querySelectorAll('[data-testid^="inventory-row-"]').length ?? 0
      if (header.getAttribute('aria-expanded') === 'true') {
        open.push(id)
        header.click()
      }
    }
    collapsedByMode.current = open
    setCounts(next)
    setCurrentGroup(undefined)
    setMode({
      fixed,
      draft: {variantId: fixed.variantId, dest: fixed.dest ?? startDest, source: 'nearest'},
    })
  }

  // ---- the block
  const block = (current: {fixed: Fixed; draft: Draft}) => {
    const {fixed, draft} = current
    const nearest = nearestOf(world, draft.variantId)
    const from = sourceEntry(draft)
    const existing = existingOf(draft)
    const variantPick = variants.find((v) => v.id === draft.variantId)

    const variantControl = fixed.variantId ? (
      <Flex align="center" data-testid="add-fixed-variant" gap={2}>
        <Text size={1}>
          <VariantDiamond />
        </Text>
        <Text size={1}>{variantTitle(fixed.variantId)}</Text>
      </Flex>
    ) : (
      <PillMenu
        boundary={frame}
        icon={variantPick ? <DimensionIcon name={variantPick.dimension} /> : undefined}
        searchLabel="Find a variant definition"
        testId="add-pill-variant"
        text={variantPick?.title ?? BASE_LABEL}
      >
        {(q) => (
          <>
            {matches(q, BASE_LABEL) ? (
              <Item
                id="add-value-base"
                onClick={() => patch({variantId: undefined})}
                selected={!draft.variantId}
                text={BASE_LABEL}
              />
            ) : null}
            {variants
              .filter((v) => matches(q, v.title))
              .map((v) => (
                <Item
                  icon={<DimensionIcon name={v.dimension} />}
                  id={`add-value-${v.value}`}
                  key={v.id}
                  onClick={() => patch({variantId: v.id})}
                  selected={draft.variantId === v.id}
                  text={v.title}
                />
              ))}
          </>
        )}
      </PillMenu>
    )

    const bundleControl = fixed.dest ? (
      <Flex align="center" data-testid="add-fixed-bundle" gap={2}>
        <Text size={1}>{destIcon(fixed.dest)}</Text>
        <Text size={1}>{destTitle(fixed.dest)}</Text>
      </Flex>
    ) : (
      <Flex>
        <PillMenu
          boundary={frame}
          icon={destIcon(draft.dest)}
          searchLabel="Find a bundle"
          testId="add-pill-bundle"
          text={destTitle(draft.dest)}
        >
          {(q) => (
            <>
              {destinations
                .filter((d) => matches(q, destTitle(d)))
                .map((d) => (
                  <Item
                    icon={destIcon(d)}
                    id={`add-bundle-${destGroup(d)}`}
                    key={destGroup(d)}
                    onClick={() => patch({dest: d})}
                    selected={destGroup(d) === destGroup(draft.dest)}
                    text={destTitle(d)}
                  />
                ))}
              {matches(q, 'Published') ? (
                <Item
                  disabled
                  icon={<ReleaseAvatarIcon release="published" />}
                  id="add-bundle-published"
                  sub="Takes no new version"
                  text="Published"
                />
              ) : null}
            </>
          )}
        </PillMenu>
      </Flex>
    )

    const documentControl = (
      <Flex>
        <PillMenu
          boundary={frame}
          icon={<DocumentsIcon />}
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
      </Flex>
    )

    const text = readBack(draft)
    return (
      <Card borderBottom borderTop data-testid="add-block" tone="default">
        <Stack gap={2} padding={3} paddingBottom={2}>
          <Text size={1} weight="semibold">
            Create version
          </Text>
          <Text data-testid="add-subtitle" muted size={1}>
            A new version of {props.documentTitle}
          </Text>
        </Stack>
        {variantsOn ? (
          <Card borderTop>
            <TableRow
              icon={<VariantDiamond />}
              meaning="Who sees this version"
              testId="add-step-variant"
              title="Variant definition"
            >
              {variantControl}
              {existing ? (
                <Text data-testid="add-exists-hint" muted size={1}>
                  {props.documentTitle} already has this version in {destTitle(draft.dest)}
                </Text>
              ) : null}
            </TableRow>
          </Card>
        ) : null}
        <Card borderTop>
          <TableRow
            icon={<PackageIcon />}
            meaning="Where it lives"
            testId="add-step-bundle"
            title="Bundle"
          >
            {bundleControl}
            {variantsOn || !existing ? null : (
              <Text data-testid="add-exists-hint" muted size={1}>
                {props.documentTitle} already has a version in {destTitle(draft.dest)}
              </Text>
            )}
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
                <Button
                  aria-describedby="add-commit-description"
                  data-testid="add-commit"
                  mode="default"
                  onClick={commit}
                  text="Create version"
                  tone="primary"
                  tooltipProps={{content: text}}
                />
              </>
            )}
          </Flex>
        </Card>
      </Card>
    )
  }

  // ---- the portals
  const toolbarButton =
    toolbar &&
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
    const isDrafts = id.startsWith('stage-') && id !== 'stage-published'
    const variant = variants.find((v) => id === `${v.dimension}-${v.value}`)
    const askable = Boolean(release || (isDrafts && draftsEnabled) || (variant && variantsOn))
    return (
      <Fragment key={id}>
        {createPortal(
          <Box data-add-anchor="" style={{flex: 'none'}}>
            <Button
              aria-label={
                askable ? 'Create version in this group' : 'This group takes no new version'
              }
              data-testid={`add-group-${id}`}
              disabled={!askable}
              icon={AddIcon}
              mode="bleed"
              onClick={(event: {stopPropagation: () => void}) => {
                event.stopPropagation()
                startMode(
                  release ? {dest: release} : variant ? {variantId: variant.id} : {dest: DRAFTS},
                )
              }}
              tooltipProps={{content: askable ? 'Create version here' : 'Takes no new version'}}
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
      <Text size={1}>{variantLabel(draft.variantId)} · New</Text>
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
            background: 'color-mix(in srgb, var(--card-fg-color) 35%, transparent)',
          }}
        />
      ) : null}
    </MenuOpenContext.Provider>
  )
}
