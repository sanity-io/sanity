import {TransferIcon} from '@sanity/icons/Transfer'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState, useSyncExternalStore} from 'react'
import {createPortal} from 'react-dom'
import {useSetVariant, useWorkspace} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {valueTitle} from '../../c1/model'
import {usePerspectiveState} from '../../c1/state'
import {useVariantDefinitions} from '../../c1/world'
import {useBannerDecision} from '../../c7/useBannerCase'
import {CreateVersion, type VariantChoice} from './CreateVersion'
import {type InventoryEntry} from './fixtures'
import {InventoryConceptsProvider} from './model'
import {useLiveWorld} from './useLiveWorld'
import {VersionInventoryPanel} from './VersionInventoryPanel'

/**
 * What the open beta takes out of Andrej's panel, by test id (his panel has no prop for it, and his files are not edited): search (toggle and
 * field), filter (toggle and bar), sort, view settings, and the panel's own header (the Studio's inspector title row replaces it). The toolbar row
 * stays with the Views menu in it, because the bulk bar takes its place when rows are selected, and a missing row would make the list jump.
 */
const HIDDEN = [
  'inventory-header',
  'inventory-search-toggle',
  'inventory-search',
  'inventory-filter-toggle',
  'inventory-filter-bar',
  'inventory-sort-menu',
  'inventory-view-settings',
  // One view, By publish date (SAPP-4724, Faheem 22 Oct): By stage is gone, so the switcher goes with it.
  'inventory-view-menu',
  // On hold (Faheem, 21 Oct): no modal create form. The footer's Create variant (and Add missing variant) is hidden until the inline create is designed.
  'inventory-footer',
]
  .map((id) => `[data-testid="${id}"]`)
  .join(', ')
  .concat(' {display: none !important}')
  // The list does not move under the pointer (SAPP-4724, Faheem 22 Oct): the toolbar row keeps its height with or without its Create version
  // (the T6 banner may offer it instead), and the bulk bar takes the row's place at the same height when a row is selected.
  .concat(
    ' [data-testid="inventory-toolbar"], [data-testid="inventory-bulk-bar"] {box-sizing: border-box; height: 41px; min-height: 41px; flex: none}',
    ' [data-testid="inventory-bulk-bar"] > [data-ui="Flex"] {flex-wrap: nowrap !important; height: 100%}',
    // A toolbar with no control says how many versions the list holds, quietly, on its left.
    ' [data-testid="inventory-summary"] {order: -1}',
    // Compare versions sits just before Create version (A, Faheem 23 Oct).
    ' [data-testid="inventory-compare"] {order: 1}',
    // Narrow (Faheem, 23 Oct): a row's name comes first. Under 380 px the Served and Editing labels give way, so names are not cut short;
    // the row's highlight and tint still mark what is in view and what is served.
    // Without drafts (live edit) the Published row in view is the one served, never a fallback: its "Served instead" would mislead.
    ' [data-no-drafts] [data-testid="inventory-served-label-target"] {display: none !important}',
    ' [data-create-frame] {container-type: inline-size}',
    ' @container (max-width: 380px) {[data-testid="inventory-served-label-target"], [data-testid="inventory-editing-label"] {display: none !important}}',
    ' [data-add-anchor] {order: 2}',
    // The plus (and the toolbar's Create version) sit in a block Box, and the Button's tooltip wrapper is inline-flex: on a text line it
    // gains the line box's strut and the button lands off its box's centre, under the header's chevron (26 Oct). As flex containers there
    // is no line box, so each box is exactly its button's height and the header centres it as it centres the chevron.
    ' [data-add-anchor], [data-add-anchor] > * {display: flex !important; align-items: center}',
    ' [data-testid="inventory-toolbar"]:has([data-testid="add-toolbar-button"]) [data-testid="inventory-summary"] {display: none}',
    // The checkbox column is kept on every row at all times: the panel's wide layout (the one used here) hides a checkbox at rest without
    // taking its width, so a row's text never moves when selecting starts.
  )

/** The toolbar's Compare versions: an icon button, as the Studio's pane header draws its actions, with the menu item's name as its tooltip. */
function CompareButton({disabled, onClick}: {disabled: boolean; onClick: () => void}) {
  const label = disabled
    ? 'There are no other versions of this document to compare.'
    : 'Compare versions'
  return (
    <Button
      aria-label="Compare versions"
      disabled={disabled}
      icon={TransferIcon}
      mode="bleed"
      onClick={onClick}
      tooltipProps={{content: label}}
    />
  )
}

const PLURAL = new Intl.PluralRules('en-US')
/** "1 version", "9 versions". */
const versionCount = (count: number) =>
  `${count} ${PLURAL.select(count) === 'one' ? 'version' : 'versions'}`

const shortId = (id: string) => id.replace(/^_\.variants\./, '')

/**
 * The group that took a version made with Create version, per document. Moving to the new version remounts the document pane and this panel with
 * it, so it is held here, outside the component: the remounted panel opens only that group, once.
 */
const receivedBy = new Map<string, string>()
const listeners = new Set<() => void>()
const setReceived = (documentId: string, group: string | undefined) => {
  if (group) receivedBy.set(documentId, group)
  else receivedBy.delete(documentId)
  for (const listener of listeners) listener()
}
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Andrej's inventory side panel (Storybook PR #47), live: his `InventoryConceptsProvider` gets the live world, his `VersionInventoryPanel` is
 * rendered as he built it (his table, rows and Create variant). Two things are hidden with a scoped style, because the panel has no prop for them
 * (his files are not edited): search, filter, sort and view settings, the footer's create button (see HIDDEN), and the panel's own header.
 * Choosing a row sets the GLOBAL perspective (an open beta limitation) to the row's release and variant.
 */
export function LiveInventory({documentId, title}: {documentId: string; title: string}) {
  const live = useLiveWorld(documentId, title)
  const workspace = useWorkspace()
  const state = usePerspectiveState()
  const setVariant = useSetVariant()
  const variants = useVariantDefinitions()
  const received = useSyncExternalStore(subscribe, () => receivedBy.get(documentId))
  const [frame, setFrame] = useState<HTMLElement | null>(null)

  const world = live
  // A, Faheem 23 Oct: Compare versions, one click from the inventory. It is the "..." menu's item (same target: the earlier layer, else
  // Published, else Draft), so the two never disagree. Disabled while the document has a single version.
  const {isDeleted, onMenuAction, schemaType} = useDocumentPane()
  // Without drafts (live edit, or the draft model off) the pane shows the published version under the Drafts perspective.
  const hasDrafts = workspace.document.drafts.enabled && !schemaType?.liveEdit
  // The count shows only once the banner case is known (with the toolbar's Create version it is hidden; see HIDDEN).
  const bannerPending = useBannerDecision(documentId).pending

  // The toolbar row, for its version count (the panel renders it; it is swapped for the bulk bar while selecting).
  const [toolbar, setToolbar] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (!frame) return undefined
    const scan = () => {
      const found = frame.querySelector<HTMLElement>('[data-testid="inventory-toolbar"]')
      setToolbar((current) => (current === found ? current : found))
    }
    scan()
    const observer = new MutationObserver(scan)
    observer.observe(frame, {childList: true, subtree: true})
    return () => observer.disconnect()
  }, [frame])

  const choices = useMemo(
    (): VariantChoice[] =>
      variants.flatMap((v) => {
        const [dimension, value] = Object.entries(v.conditions)[0] ?? []
        if (!dimension) return []
        return [
          {
            id: shortId(v._id),
            title: v.metadata?.title ?? shortId(v._id),
            dimension,
            value: String(value),
            valueTitle: valueTitle(
              state.dimensions.find((d) => d.name === dimension) ?? {
                name: dimension,
                title: dimension,
                values: [],
              },
              String(value),
            ),
          },
        ]
      }),
    [variants, state.dimensions],
  )

  const variantFor = useCallback(
    (variantId: string | undefined) => variants.find((v) => shortId(v._id) === variantId),
    [variants],
  )

  // The row the address already shows: the version and the variant the navbar names.
  const currentEntryKey = useMemo(() => {
    const entries = Object.entries(state.chosen)
    const exact = entries.length
      ? variants.find((v) => {
          const own = Object.entries(v.conditions)
          return (
            own.length === entries.length && own.every(([name, key]) => state.chosen[name] === key)
          )
        })
      : undefined
    const version = !hasDrafts && state.version === 'drafts' ? 'published' : state.version
    return `${version}:${exact ? shortId(exact._id) : 'base'}`
  }, [state.chosen, state.version, variants, hasDrafts])

  const onSelect = useCallback(
    (entry: InventoryEntry) => {
      const variant = variantFor(entry.variantId)
      // One navigation sets the version and the variant, so the document pane shows that version (the inspector stays open).
      setVariant({variantId: variant?._id as never, perspective: entry.group as never})
      state.setChosen(variant ? variant.conditions : {})
    },
    [setVariant, variantFor, state],
  )

  const onCreate = useCallback(
    (entry: InventoryEntry, group: string) => {
      setReceived(documentId, group)
      // The version is created: the global perspective moves to it (the open beta limit), in one navigation.
      onSelect(entry)
    },
    [documentId, onSelect],
  )

  if (!world) {
    // The panel's frame stays while a document's versions load (a document switch keeps the inspector open): the toolbar row keeps its
    // height, empty, and the list's place says it is loading. Nothing moves when the versions arrive.
    return (
      <Flex data-testid="inventory-loading" direction="column" height="fill">
        <Box data-testid="inventory-toolbar-placeholder" style={{flex: 'none', height: 41}} />
        <Card padding={3}>
          <Text muted size={1}>
            Loading versions…
          </Text>
        </Card>
      </Flex>
    )
  }
  return (
    <Flex
      data-create-frame=""
      data-no-drafts={hasDrafts ? undefined : ''}
      direction="column"
      height="fill"
      ref={setFrame}
      style={{position: 'relative'}}
    >
      <style>{HIDDEN}</style>
      <Box flex={1} style={{minHeight: 0}}>
        {world.entries.length === 0 ? (
          // 26 Oct call (Pedro): a new document is not stored until its first change, and a deleted one has nothing left, so the list was blank.
          // The text says why, and what to do: a new document is saved by its first change; a deleted one (core's isDeleted: no version left and not
          // pristine) is restored, as the deleted banner offers. Create version cannot help here: the base document is made by editing it.
          <Stack data-testid="inventory-empty" gap={2} padding={4}>
            <Text size={1} weight="medium">
              {isDeleted
                ? 'This document was deleted.'
                : 'No versions exist yet for this document.'}
            </Text>
            <Text muted size={1}>
              {isDeleted
                ? 'Restore it to bring its versions back.'
                : hasDrafts
                  ? 'Make a change to save a draft.'
                  : 'Make a change to save the document.'}
            </Text>
          </Stack>
        ) : (
          <InventoryConceptsProvider
            // The panel's audience is the navbar's, so its Served label names what the chosen audience gets; a new audience starts it afresh.
            initialVisitor={state.chosen as never}
            key={JSON.stringify(state.chosen)}
            initialView="publishDate"
            selection={{currentEntryKey, onSelect}}
            world={world}
          >
            <VersionInventoryPanel />
          </InventoryConceptsProvider>
        )}
      </Box>
      {toolbar
        ? createPortal(
            <Box data-testid="inventory-compare" style={{flex: 'none'}}>
              <CompareButton
                disabled={world.entries.length < 2}
                onClick={() => onMenuAction({action: 'compareVersions', title: 'Compare versions'})}
              />
            </Box>,
            toolbar,
          )
        : null}
      {toolbar && !bannerPending
        ? createPortal(
            <Text data-testid="inventory-summary" muted size={1}>
              {versionCount(world.entries.length)}
            </Text>,
            toolbar,
          )
        : null}
      <CreateVersion
        documentId={documentId}
        documentTitle={title}
        draftsEnabled={workspace.document.drafts.enabled}
        frame={frame}
        onCreate={onCreate}
        onReceived={() => setReceived(documentId, undefined)}
        received={received}
        onOpen={onSelect}
        variants={choices}
        world={world}
      />
    </Flex>
  )
}
