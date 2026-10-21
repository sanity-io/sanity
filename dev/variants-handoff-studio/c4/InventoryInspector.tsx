import {DocumentsIcon} from '@sanity/icons/Documents'
import {Flex} from '@sanity/ui'
import {type DocumentInspector, type DocumentInspectorProps} from 'sanity'
import {DocumentInspectorHeader, useDocumentPane} from 'sanity/structure'

import {useCorpus} from '../c5/useCorpus'
import {HandoffList} from './HandoffList'

/**
 * C4 option D, "Handoff list": the document's versions as one list grouped by bundle, in the document inspector, under the Studio's own
 * inspector title row ("Versions" and a close button). The Versions entry sits in the inspector menu next to the Studio's own.
 */
function Inventory({documentId}: DocumentInspectorProps) {
  const corpus = useCorpus()
  const {closeInspector} = useDocumentPane()
  return (
    <Flex direction="column" height="fill">
      <DocumentInspectorHeader
        closeButtonLabel="Close versions"
        onClose={closeInspector}
        title="Versions"
      />
      <div style={{flex: 1, minHeight: 0}}>
        <HandoffList
          documentId={documentId}
          title={corpus?.docs.find((d) => d.id === documentId)?.title ?? documentId}
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
