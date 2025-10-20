import {type Path} from '@sanity/types'

import {StructureToolProvider} from '../../structure/StructureToolProvider'
import {
  type PresentationNavigate,
  type PresentationSearchParams,
  type StructureDocumentPaneParams,
} from '../types'
import {DocumentPane} from './DocumentPane'

export function DocumentPanel(props: {
  documentId: string
  documentType: string
  onEditReference: PresentationNavigate
  onFocusPath: (state: Path) => void
  focusPath: Path
  onStructureParams: (params: StructureDocumentPaneParams) => void
  searchParams: PresentationSearchParams
  structureParams: StructureDocumentPaneParams
}): React.JSX.Element {
  const {
    documentId,
    documentType,
    onFocusPath,
    focusPath,
    onEditReference,
    onStructureParams,
    searchParams,
    structureParams,
  } = props
  return (
    <StructureToolProvider>
      <DocumentPane
        documentId={documentId}
        documentType={documentType}
        onEditReference={onEditReference}
        onStructureParams={onStructureParams}
        onFocusPath={onFocusPath}
        focusPath={focusPath}
        searchParams={searchParams}
        structureParams={structureParams}
      />
    </StructureToolProvider>
  )
}
