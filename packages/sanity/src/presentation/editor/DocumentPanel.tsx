import {StructureToolProvider} from '../../structure/StructureToolProvider'
import {
  type PresentationNavigate,
  type PresentationSearchParams,
  type PresentationStateParams,
  type StructureDocumentPaneParams,
} from '../types'
import {DocumentPane} from './DocumentPane'

export function DocumentPanel(props: {
  documentId: string
  documentType: string
  onEditReference: PresentationNavigate
  onFocusPath: (state: Required<PresentationStateParams>) => void
  onStructureParams: (params: StructureDocumentPaneParams) => void
  searchParams: PresentationSearchParams
  structureParams: StructureDocumentPaneParams
}): React.JSX.Element {
  const {
    documentId,
    documentType,
    onFocusPath,
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
        onFocusPath={onFocusPath}
        onStructureParams={onStructureParams}
        searchParams={searchParams}
        structureParams={structureParams}
      />
    </StructureToolProvider>
  )
}
