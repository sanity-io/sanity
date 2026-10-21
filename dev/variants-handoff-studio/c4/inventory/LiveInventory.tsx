import {Box, Card, Flex, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {useSetVariant} from 'sanity'

import {usePerspectiveState} from '../../c1/state'
import {useVariantDefinitions} from '../../c1/world'
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
  // On hold (Faheem, 21 Oct): no modal create form. The footer's Create variant (and Add missing variant) is hidden until the inline create is designed.
  'inventory-footer',
]
  .map((id) => `[data-testid="${id}"]`)
  .join(', ')
  .concat(' {display: none !important}')

const shortId = (id: string) => id.replace(/^_\.variants\./, '')

/**
 * Andrej's inventory side panel (Storybook PR #47), live: his `InventoryConceptsProvider` gets the live world, his `VersionInventoryPanel` is
 * rendered as he built it (his table, rows and Create variant). Two things are hidden with a scoped style, because the panel has no prop for them
 * (his files are not edited): search, filter, sort and view settings, the footer's create button (see HIDDEN), and the panel's own header.
 * Choosing a row sets the GLOBAL perspective (an open beta limitation) to the row's release and variant.
 */
export function LiveInventory({documentId, title}: {documentId: string; title: string}) {
  const world = useLiveWorld(documentId, title)
  const state = usePerspectiveState()
  const setVariant = useSetVariant()
  const variants = useVariantDefinitions()

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
    return `${state.version}:${exact ? shortId(exact._id) : 'base'}`
  }, [state.chosen, state.version, variants])

  const onSelect = useCallback(
    (entry: InventoryEntry) => {
      const variant = variantFor(entry.variantId)
      // One navigation sets the version and the variant, so the document pane shows that version (the inspector stays open).
      setVariant({variantId: variant?._id as never, perspective: entry.group as never})
      state.setChosen(variant ? variant.conditions : {})
    },
    [setVariant, variantFor, state],
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
      <style>{HIDDEN}</style>
      <Box flex={1} style={{minHeight: 0}}>
        <InventoryConceptsProvider selection={{currentEntryKey, onSelect}} world={world}>
          <VersionInventoryPanel />
        </InventoryConceptsProvider>
      </Box>
    </Flex>
  )
}
