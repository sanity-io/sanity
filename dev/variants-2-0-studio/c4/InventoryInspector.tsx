import {DocumentsIcon} from '@sanity/icons/Documents'
import {Card, Text} from '@sanity/ui'
import {type DocumentInspector, type DocumentInspectorProps} from 'sanity'

import {SharedInventory} from '../c5/ActionableLenses'
import {useCorpus} from '../c5/useCorpus'
import {useVariantDefinitions} from '../c1/world'
import {STOCK_OPTION, useOption} from '../options/store'
import {PlaceholderSlot} from '../slots/PlaceholderSlot'
import {LiveInventory} from './inventory/LiveInventory'

/**
 * C4 V1 (inventory pane), live data. Option B (engineering direction): the document INSPECTOR, a list of every
 * version of this document: base first, then variants, with state and time. Option A (a sidebar pane) arrives from
 * Andrej's inventory side panel, so it is a placeholder here.
 */
function SharedFromCorpus({documentId}: {documentId: string}) {
  const corpus = useCorpus()
  const definitions = useVariantDefinitions()
  if (!corpus) return <Card padding={3}><Text muted size={1}>Loading versions…</Text></Card>
  return <SharedInventory corpus={corpus} definitions={definitions} docId={documentId} />
}

function Inventory({documentId}: DocumentInspectorProps) {
  const option = useOption('c4')
  // A and B show Andrej's panel (B opens it as a popover from the pane, but a click on a list row's control still lands
  // here). C is the C5 document lens, mini, with an Expand control for the full table.
  if (option === 'a' || option === 'b') return <LiveInventory documentId={documentId} title={documentId} />
  if (option === 'c') return <SharedFromCorpus documentId={documentId} />
  return <PlaceholderSlot component="c4" />
}

export const inventoryInspector: DocumentInspector = {
  name: 'variants-inventory',
  component: Inventory,
  useMenuItem: () => ({
    // Stock: no inspector entry at all.
    // Stock: none. Option B opens the inventory as a popover instead.
    hidden: useOption('c4') === STOCK_OPTION || useOption('c4') === 'b',
    icon: DocumentsIcon,
    title: 'Versions',
    showAsAction: true,
  }),
}
