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
import {getPresentationPanelHtmlId} from './panels/presentationLayoutTab'
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
  visualOrderPublishedIds: string[]
  documentType: PresentationParamsContextValue['type']
  getCommentIntent: CommentIntentGetter
  /** Hide the document panel (narrow mode, another tab active). */
  hidden?: boolean
  mainDocumentState: MainDocumentState | undefined
  onEditReference: PresentationNavigate
  onFocusPath: (state: Required<PresentationStateParams>) => void
  onStructureParams: (params: StructureDocumentPaneParams) => void
  /** Hide the preceding resizer (narrow mode). */
  resizerHidden?: boolean
  searchParams: PresentationSearchParams
  setDisplayedDocument: Dispatch<SetStateAction<Partial<SanityDocument> | null | undefined>>
  structureParams: StructureDocumentPaneParams
}

const PresentationContentWrapper: FunctionComponent<
  PropsWithChildren<{
    documentId?: string
    getCommentIntent: CommentIntentGetter
    hidden?: boolean
    resizerHidden?: boolean
    setDisplayedDocument: Dispatch<SetStateAction<Partial<SanityDocument> | null | undefined>>
  }>
> = (props) => {
  const {documentId, hidden, resizerHidden, setDisplayedDocument, getCommentIntent} = props
  return (
    <>
      <PanelResizer order={4} hidden={resizerHidden} />
      <Panel
        id="content"
        htmlId={getPresentationPanelHtmlId('content')}
        minWidth={325}
        order={5}
        hidden={hidden}
      >
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
    visualOrderPublishedIds,
    documentType,
    getCommentIntent,
    hidden,
    mainDocumentState,
    onEditReference,
    onFocusPath,
    onStructureParams,
    resizerHidden,
    searchParams,
    setDisplayedDocument,
    structureParams,
  } = props

  return (
    <PresentationContentWrapper
      documentId={documentId}
      getCommentIntent={getCommentIntent}
      hidden={hidden}
      resizerHidden={resizerHidden}
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
        visualOrderPublishedIds={visualOrderPublishedIds}
        searchParams={searchParams}
        structureParams={structureParams}
      />
    </PresentationContentWrapper>
  )
}
