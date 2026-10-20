import {DocumentsIcon} from '@sanity/icons/Documents'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {useState} from 'react'
import {type DocumentInspector, type DocumentInspectorProps} from 'sanity'

import {DocumentVersionsLens, SharedInventory, WideOverlay} from '../c5/ActionableLenses'
import {useCorpus} from '../c5/useCorpus'
import {useVariantDefinitions} from '../c1/world'
import {STOCK_OPTION, useOption} from '../options/store'
import {PlaceholderSlot} from '../slots/PlaceholderSlot'
import {InventoryExpandContext} from './inventory/expandContext'
import {LiveInventory} from './inventory/LiveInventory'

/**
 * C4, live. Option A: Andrej's inventory panel (Storybook PR #47) as the document inspector, on the document's real
 * versions (./inventory/*), with Expand, which opens the C5 document lens in a dialog (the lens carries the actions the
 * panel does not: publish, unpublish, delete one version). Option B: the same panel as a popover (ManageVersions).
 * Option C is archived: the shared C5 lens at mini width, the previous A, kept so old presets still resolve.
 */
function SharedFromCorpus({documentId}: {documentId: string}) {
  const corpus = useCorpus()
  const definitions = useVariantDefinitions()
  if (!corpus) return <Card padding={3}><Text muted size={1}>Loading versions…</Text></Card>
  return <SharedInventory corpus={corpus} definitions={definitions} docId={documentId} />
}

/** The panel; its header's expand control opens the full C5 document lens for this document in a dialog. */
function PanelWithExpand({documentId}: {documentId: string}) {
  const [expanded, setExpanded] = useState(false)
  const corpus = useCorpus()
  const definitions = useVariantDefinitions()
  return (
    <Flex direction="column" height="fill">
      <Box flex={1} overflow="hidden">
        <InventoryExpandContext.Provider value={corpus ? () => setExpanded(true) : null}>
          <LiveInventory documentId={documentId} title={corpus?.docs.find((d) => d.id === documentId)?.title ?? documentId} />
        </InventoryExpandContext.Provider>
      </Box>
      {expanded && corpus ? (
        <WideOverlay onClose={() => setExpanded(false)} title="Version inventory">
          <DocumentVersionsLens corpus={corpus} definitions={definitions} docId={documentId} onPin={() => undefined} />
        </WideOverlay>
      ) : null}
    </Flex>
  )
}

function Inventory({documentId}: DocumentInspectorProps) {
  const option = useOption('c4')
  // B is a popover from the pane (its inspector menu entry is hidden; a click on a list row's control still lands here).
  if (option === 'a' || option === 'b') return <PanelWithExpand documentId={documentId} />
  if (option === 'c') return <SharedFromCorpus documentId={documentId} />
  return <PlaceholderSlot component="c4" />
}

export const inventoryInspector: DocumentInspector = {
  name: 'variants-inventory',
  component: Inventory,
  useMenuItem: () => ({
    // Stock: no inspector entry at all. Option B opens the inventory as a popover instead.
    hidden: useOption('c4') === STOCK_OPTION || useOption('c4') === 'b',
    icon: DocumentsIcon,
    title: 'Versions',
    showAsAction: true,
  }),
}
