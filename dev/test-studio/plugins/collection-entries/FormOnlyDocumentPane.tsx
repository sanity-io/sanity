import {useMemo} from 'react'
import {useRouter} from 'sanity/router'
import {
  DocumentPane,
  type DocumentPaneNode,
  type EditReferenceOptions,
  PaneLayout,
  PaneRouterContext,
  type PaneRouterContextValue,
} from 'sanity/structure'

export type PaneParams = Record<string, string | undefined>

// The tool owns navigation, so every link the document pane renders is a dead end.
function NoLink() {
  return null
}

function noop() {}

interface FormOnlyDocumentPaneProps {
  documentId: string
  documentType: string
  params: PaneParams
  onParamsChange: (params: PaneParams) => void
  onEditReference: (options: EditReferenceOptions) => void
}

export function FormOnlyDocumentPane(props: FormOnlyDocumentPaneProps) {
  const {documentId, documentType, params, onParamsChange, onEditReference} = props
  const {navigateIntent} = useRouter()

  const paneRouter: PaneRouterContextValue = useMemo(
    () => ({
      index: 0,
      groupIndex: 0,
      siblingIndex: 0,
      payload: {},
      params,
      hasGroupSiblings: false,
      groupLength: 1,
      routerPanesState: [],
      ChildLink: NoLink,
      ReferenceChildLink: NoLink,
      ParameterizedLink: NoLink,
      handleEditReference: onEditReference,
      replaceCurrent: noop,
      closeCurrent: noop,
      closeCurrentAndAfter: noop,
      duplicateCurrent: noop,
      setView: noop,
      setParams: onParamsChange,
      setPayload: noop,
      createPathWithParams: () => '',
      navigateIntent,
    }),
    [navigateIntent, onEditReference, onParamsChange, params],
  )

  const pane: DocumentPaneNode = useMemo(
    () => ({
      id: documentId,
      type: 'document',
      title: '',
      options: {id: documentId, type: documentType},
    }),
    [documentId, documentType],
  )

  return (
    <PaneLayout className="collection-entries-pane" style={{height: '100%'}}>
      <PaneRouterContext.Provider value={paneRouter}>
        <DocumentPane paneKey={documentId} index={1} itemId={documentId} pane={pane} />
      </PaneRouterContext.Provider>
    </PaneLayout>
  )
}
