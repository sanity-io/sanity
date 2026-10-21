import {DocumentsIcon} from '@sanity/icons/Documents'
import {Flex} from '@sanity/ui'
import {type DocumentInspector, type DocumentInspectorProps} from 'sanity'
import {DocumentInspectorHeader, useDocumentPane} from 'sanity/structure'

import {useCorpus} from '../c5/useCorpus'
import {LiveInventory} from './inventory/LiveInventory'

/**
 * C4 for the Handoff Studio: Andrej's inventory panel (without its toolbar), in the document inspector, under the Studio's own
 * inspector title row ("Versions" and a close button). The Versions entry sits in the inspector menu next to the Studio's own.
 */
function Inventory({documentId}: DocumentInspectorProps) {
  const corpus = useCorpus()
  const {closeInspector, value} = useDocumentPane()
  // The corpus lists only the seeded documents; any other document is named by its own title field.
  const own = typeof value.title === 'string' && value.title ? value.title : undefined
  return (
    <Flex direction="column" height="fill">
      <DocumentInspectorHeader
        closeButtonLabel="Close versions"
        onClose={closeInspector}
        title="Versions"
      />
      <div style={{flex: 1, minHeight: 0}}>
        <LiveInventory
          documentId={documentId}
          title={corpus?.docs.find((d) => d.id === documentId)?.title ?? own ?? documentId}
        />
      </div>
    </Flex>
  )
}

export const inventoryInspector: DocumentInspector = {
  name: 'variants-inventory',
  component: Inventory,
  useMenuItem: () => ({icon: DocumentsIcon, title: 'Versions', showAsAction: true}),
}
