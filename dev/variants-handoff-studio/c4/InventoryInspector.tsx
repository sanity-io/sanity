import {DocumentsIcon} from '@sanity/icons/Documents'
import {type DocumentInspector, type DocumentInspectorProps} from 'sanity'

import {useCorpus} from '../c5/useCorpus'
import {HandoffList} from './HandoffList'

/**
 * C4 option D, "Handoff list": the document's versions as one list grouped by bundle, in the document inspector. The Versions entry sits in the
 * inspector menu next to the Studio's own (History, References, Comments).
 */
function Inventory({documentId}: DocumentInspectorProps) {
  const corpus = useCorpus()
  return (
    <HandoffList
      documentId={documentId}
      title={corpus?.docs.find((d) => d.id === documentId)?.title ?? documentId}
    />
  )
}

export const inventoryInspector: DocumentInspector = {
  name: 'variants-inventory',
  component: Inventory,
  useMenuItem: () => ({icon: DocumentsIcon, title: 'Versions', showAsAction: true}),
}
