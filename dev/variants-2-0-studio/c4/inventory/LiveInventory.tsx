import {Box, Card, Flex, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useSetVariant} from 'sanity'

import {usePerspectiveState} from '../../c1/state'
import {useVariantDefinitions} from '../../c1/world'
import {HidePriorityView, VisitorLensLine, VisitorLensPanel} from '../VisitorLens'
import {type InventoryEntry} from './fixtures'
import {InventoryConceptsProvider} from './model'
import {useLiveWorld} from './useLiveWorld'
import {VersionInventoryPanel} from './VersionInventoryPanel'

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

  const variantFor = useCallback(
    (variantId: string | undefined) => variants.find((v) => shortId(v._id) === variantId),
    [variants],
  )

  // The row the address already shows: the version and the variant the C1 row names.
  const currentEntryKey = useMemo(() => {
    const entries = Object.entries(s.chosen)
    const exact = entries.length
      ? variants.find((v) => {
          const own = Object.entries(v.conditions)
          return own.length === entries.length && own.every(([name, key]) => s.chosen[name] === key)
        })
      : undefined
    return `${s.version}:${exact ? shortId(exact._id) : 'base'}`
  }, [s.chosen, s.version, variants])

  const onSelect = useCallback(
    (entry: InventoryEntry) => {
      const variant = variantFor(entry.variantId)
      // One navigation sets the version and the variant, so the document pane shows that version (inspector stays open).
      setVariant({variantId: variant?._id as never, perspective: entry.group as never})
      s.setChosen(variant ? variant.conditions : {})
      if (variant) s.setRowShown(true)
    },
    [setVariant, variantFor, s],
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
      {lensOpen ? null : <VisitorLensLine onOpen={() => setLensOpen(true)} />}
      <HidePriorityView />
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
