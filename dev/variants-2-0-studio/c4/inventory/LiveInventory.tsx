import {Box, Card, Flex, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useSetVariant} from 'sanity'

import {usePerspectiveState} from '../../c1/state'
import {useVariantDefinitions} from '../../c1/world'
import {useCompareActions} from '../../compare/useCompare'
import {useOption} from '../../design-options/store'
import {useLocalBar} from '../../pane/localBar'
import {usePaneAddress} from '../../pane/usePaneAddress'
import {HidePriorityView, VisitorLensLine, VisitorLensPanel} from '../VisitorLens'
import {type InventoryEntry} from './fixtures'
import {InventoryConceptsProvider} from './model'
import {useLiveWorld} from './useLiveWorld'
import {VersionInventoryPanel} from './VersionInventoryPanel'

// Cmd or Ctrl held while a version is chosen: with Compare on, the version opens BESIDE the current document (E9 compare B).
let openBesideHeld = false
if (typeof window !== 'undefined')
  window.addEventListener(
    'pointerdown',
    (event) => void (openBesideHeld = event.metaKey || event.ctrlKey),
    true,
  )

const shortId = (id: string) => id.replace(/^_\.variants\./, '')

/**
 * C4 Option A: Andrej's inventory side panel (Storybook PR #47), live. His `InventoryConceptsProvider` gets the live
 * world; choosing a row (his `selection` hook) sets the studio perspective to the row's release and the C1 row's
 * variant values to the row's variant, so the address row and the inventory agree. Not carried over: the navbar eye
 * and the bulk bar that replaces the toolbar.
 */
export function LiveInventory({documentId, title}: {documentId: string; title: string}) {
  const world = useLiveWorld(documentId, title)
  const s = usePerspectiveState()
  const setVariant = useSetVariant()
  const variants = useVariantDefinitions()
  const [lensOpen, setLensOpen] = useState(false)
  const compare = useOption('compare')
  const compareActions = useCompareActions()
  // Open beta header (c2 C, spec V1 to V4): a row opens that version in THIS pane only and makes the pane local; the navbar, the document list
  // and the other panes do not change. The selected row is the pane's own address.
  const paneMode = useOption('c2') === 'c'
  const pane = usePaneAddress()
  const [, setBarOpen] = useLocalBar()

  const variantFor = useCallback(
    (variantId: string | undefined) => variants.find((v) => shortId(v._id) === variantId),
    [variants],
  )

  // The row the address already shows: the version and the variant the C1 row names.
  const currentEntryKey = useMemo(() => {
    if (paneMode) {
      const shown = pane.held ? pane.local : pane.global
      return `${shown.perspective}:${shown.variant === 'none' ? 'base' : shown.variant}`
    }
    const entries = Object.entries(s.chosen)
    const exact = entries.length
      ? variants.find((v) => {
          const own = Object.entries(v.conditions)
          return own.length === entries.length && own.every(([name, key]) => s.chosen[name] === key)
        })
      : undefined
    return `${s.version}:${exact ? shortId(exact._id) : 'base'}`
  }, [s.chosen, s.version, variants, paneMode, pane.held, pane.local, pane.global])

  const onSelect = useCallback(
    (entry: InventoryEntry) => {
      const variant = variantFor(entry.variantId)
      if (compare !== 'a' && openBesideHeld) {
        compareActions.openBeside(documentId, {
          perspective: entry.group as string,
          variant: variant ? shortId(variant._id) : 'none',
        })
        return
      }
      if (paneMode) {
        pane.set({
          perspective: entry.group as string,
          variant: variant ? shortId(variant._id) : 'none',
        })
        setBarOpen(true)
        return
      }
      // One navigation sets the version and the variant, so the document pane shows that version (inspector stays open).
      setVariant({variantId: variant?._id as never, perspective: entry.group as never})
      s.setChosen(variant ? variant.conditions : {})
      if (variant) s.setRowShown(true)
    },
    [setVariant, variantFor, s, compare, compareActions, documentId, paneMode, pane, setBarOpen],
  )

  if (!world) {
    return (
      <Card padding={3}>
        <Text muted size={1}>
          Loading versions…
        </Text>
      </Card>
    )
  }
  return (
    <Flex direction="column" height="fill">
      {lensOpen || paneMode ? null : <VisitorLensLine onOpen={() => setLensOpen(true)} />}
      <HidePriorityView />
      {compare !== 'a' ? (
        <Box data-testid="open-beside-hint" paddingX={3} paddingY={2}>
          <Text muted size={0}>
            Cmd-click a version to open it beside this document.
          </Text>
        </Box>
      ) : null}
      {lensOpen ? (
        <Box flex={1} overflow="auto">
          <VisitorLensPanel
            documentId={documentId}
            onClose={() => setLensOpen(false)}
            title={title}
          />
        </Box>
      ) : null}
      <Box flex={1} style={{display: lensOpen ? 'none' : undefined, minHeight: 0}}>
        <InventoryConceptsProvider selection={{currentEntryKey, onSelect}} world={world}>
          <VersionInventoryPanel />
        </InventoryConceptsProvider>
      </Box>
    </Flex>
  )
}
