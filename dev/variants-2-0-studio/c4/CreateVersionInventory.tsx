import {TransferIcon} from '@sanity/icons/Transfer'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState, useSyncExternalStore} from 'react'
import {createPortal} from 'react-dom'
import {useSetVariant, useWorkspace} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {valueTitle} from '../c1/model'
import {usePerspectiveState} from '../c1/state'
import {useVariantDefinitions} from '../c1/world'
import {inOpenBeta} from '../data/versions'
import {useOptionState} from '../options/store'
import {CreateVersion, type VariantChoice} from './inventory/CreateVersion'
import {type InventoryEntry} from './inventory/fixtures'
import {InventoryConceptsProvider} from './inventory/model'
import {useLiveWorld} from './inventory/useLiveWorld'
import {VersionInventoryPanel} from './inventory/VersionInventoryPanel'

/**
 * Option E shows Andrej's full toolbar (views, grouping, sort, search, filters, view settings) with Create version beside it: the Design Studio's
 * inventory is the fleshed-out one, the Handoff Studio's the trimmed one (Faheem, 22 Oct). Two things are hidden by test id: the footer's
 * Create variant (Create version replaces it) and the panel's own header.
 */
const HIDDEN = [
  'inventory-footer',
  // The panel's own header: its close is a placeholder. The Studio's inspector title row replaces it (as the Handoff Studio's), with a close that works.
  'inventory-header',
]
  .map((id) => `[data-testid="${id}"]`)
  .join(', ')
  .concat(' {display: none !important}')
  // Compare versions sits just before Create version (from the Handoff Studio's a1f6fcf45f, A, Faheem 23 Oct), after Andrej's controls.
  .concat(' [data-testid="inventory-compare"] {order: 1}')
  .concat(' [data-add-anchor] {order: 2}')
  // Narrow (from the Handoff Studio's 0bb7bad0cf, Faheem 23 Oct): a row's name comes first. Under 380 px the Served and Editing labels give way,
  // so names are not cut short; the row's highlight and tint still mark what is in view and what is served.
  // Without drafts (live edit) the Published row in view is the one served, never a fallback: its "Served instead" would mislead.
  .concat(
    ' [data-no-drafts] [data-testid="inventory-served-label-target"] {display: none !important}',
  )
  .concat(' [data-create-frame] {container-type: inline-size}')
  .concat(
    ' @container (max-width: 380px) {[data-testid="inventory-served-label-target"], [data-testid="inventory-editing-label"] {display: none !important}}',
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
 * C4 option E, "Create version": Andrej's inventory side panel, live, with the T4 Create version mode (shared with the handoff studio, ./inventory/CreateVersion.tsx): his `InventoryConceptsProvider` gets the live world, his `VersionInventoryPanel` is
 * rendered as he built it (his table, rows and Create variant). Two things are hidden with a scoped style, because the panel has no prop for them
 * (his files are not edited): search, filter, sort and view settings, the footer's create button (see HIDDEN), and the panel's own header.
 * Choosing a row sets the GLOBAL perspective (an open beta limitation) to the row's release and variant.
 */
export function CreateVersionInventory({documentId, title}: {documentId: string; title: string}) {
  const live = useLiveWorld(documentId, title)
  const workspace = useWorkspace()
  const state = usePerspectiveState()
  const setVariant = useSetVariant()
  const variants = useVariantDefinitions()
  const received = useSyncExternalStore(subscribe, () => receivedBy.get(documentId))
  const [frame, setFrame] = useState<HTMLElement | null>(null)
  // A, Faheem 23 Oct: Compare versions, one click from the inventory. It is the "..." menu's item (same target: the earlier layer, else
  // Published, else Draft), so the two never disagree. Disabled while the document has a single version.
  const {onMenuAction, schemaType} = useDocumentPane()
  // Without drafts (live edit, or the draft model off) the pane shows the published version under the Drafts perspective.
  const hasDrafts = workspace.document.drafts.enabled && !schemaType?.liveEdit

  // The toolbar row, for Compare versions (the panel renders it; it is swapped for the bulk bar while selecting).
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

  // The open beta stage has one dimension (Audience), as the Handoff Studio: versions of a variant on another dimension are not listed. GA lists all.
  const {stage} = useOptionState()
  const inScope = useCallback(
    (variantId: string | undefined) =>
      stage !== 'open-beta' ||
      !variantId ||
      inOpenBeta(variants.find((v) => shortId(v._id) === variantId)?.conditions),
    [stage, variants],
  )
  const world = useMemo(
    // By publish date lists the drafts as a group under Published (his model, 6a96d926d8).
    () =>
      live && {
        ...live,
        entries: live.entries.filter((e) => inScope(e.variantId)),
      },
    [live, inScope],
  )

  const choices = useMemo(
    (): VariantChoice[] =>
      variants.flatMap((v) => {
        const [dimension, value] = Object.entries(v.conditions)[0] ?? []
        if (!dimension || !inScope(shortId(v._id))) return []
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
    [variants, state.dimensions, inScope],
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
    // height, empty, and the list's place says it is loading (from the Handoff Studio's 6c0648d75f).
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
        <InventoryConceptsProvider selection={{currentEntryKey, onSelect}} world={world}>
          <VersionInventoryPanel />
        </InventoryConceptsProvider>
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
