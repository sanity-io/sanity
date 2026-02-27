import {
  type Dispatch,
  type FunctionComponent,
  type PropsWithChildren,
  type SetStateAction,
} from 'react'
import {type CommentIntentGetter, CommentsIntentProvider, type SanityDocument} from 'sanity'

import {ContentEditor} from './editor/ContentEditor'
import {DisplayedDocumentBroadcasterProvider} from './loader/DisplayedDocumentBroadcaster'
import {Panel} from './panels/Panel'
import {PanelResizer} from './panels/PanelResizer'
import {
  type MainDocumentState,
  type PresentationNavigate,
  type PresentationParamsContextValue,
  type PresentationSearchParams,
  type PresentationStateParams,
  type StructureDocumentPaneParams,
} from './types'

export interface PresentationContentProps {
  documentId: PresentationParamsContextValue['id']
  documentsOnPage: {_id: string; _type: string}[]
  documentType: PresentationParamsContextValue['type']
  getCommentIntent: CommentIntentGetter
  mainDocumentState: MainDocumentState | undefined
  onEditReference: PresentationNavigate
  onFocusPath: (state: Required<PresentationStateParams>) => void
  onStructureParams: (params: StructureDocumentPaneParams) => void
  searchParams: PresentationSearchParams
  setDisplayedDocument: Dispatch<SetStateAction<Partial<SanityDocument> | null | undefined>>
  structureParams: StructureDocumentPaneParams
}

const PresentationContentWrapper: FunctionComponent<
  PropsWithChildren<{
    documentId?: string
    getCommentIntent: CommentIntentGetter
    setDisplayedDocument: Dispatch<SetStateAction<Partial<SanityDocument> | null | undefined>>
  }>
> = (props) => {
  const {documentId, setDisplayedDocument, getCommentIntent} = props
  return (
    <>
      <PanelResizer order={4} />
      <Panel id="content" minWidth={325} order={5}>
        <DisplayedDocumentBroadcasterProvider
          documentId={documentId}
          setDisplayedDocument={setDisplayedDocument}
        >
          <CommentsIntentProvider getIntent={getCommentIntent}>
            {props.children}
          </CommentsIntentProvider>
        </DisplayedDocumentBroadcasterProvider>
      </Panel>
    </>
  )
}

export const PresentationContent: FunctionComponent<PresentationContentProps> = (props) => {
  const {
    documentId,
    documentsOnPage,
    documentType,
    getCommentIntent,
    mainDocumentState,
    onEditReference,
    onFocusPath,
    onStructureParams,
    searchParams,
    setDisplayedDocument,
    structureParams,
  } = props

  return (
    <PresentationContentWrapper
      documentId={documentId}
      getCommentIntent={getCommentIntent}
      setDisplayedDocument={setDisplayedDocument}
    >
      <ContentEditor
        documentId={documentId}
        documentType={documentType}
        mainDocumentState={mainDocumentState}
        onEditReference={onEditReference}
        onFocusPath={onFocusPath}
        onStructureParams={onStructureParams}
        refs={documentsOnPage}
        searchParams={searchParams}
        structureParams={structureParams}
      />
    </PresentationContentWrapper>
  )
}
