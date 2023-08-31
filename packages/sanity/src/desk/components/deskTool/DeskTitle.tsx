import React, {useEffect} from 'react'
import {ObjectSchemaType} from '@sanity/types'
import {Panes} from '../../structureResolvers'
import {useDeskTool} from '../../useDeskTool'
import {LOADING_PANE} from '../../constants'
import {DocumentPaneNode} from '../../types'
import {useEditState, useSchema, unstable_useValuePreview as useValuePreview} from 'sanity'

interface DeskTitleProps {
  resolvedPanes: Panes['resolvedPanes']
}

const DocumentTitle = (props: {title: string; documentId: string; documentType: string}) => {
  const {title, documentId, documentType} = props
  const editState = useEditState(documentId, documentType)
  const schema = useSchema()
  const isNewDocument = !editState?.published && !editState?.draft
  const documentValue = editState?.draft || editState?.published
  const schemaType = schema.get(documentType) as ObjectSchemaType | undefined

  const {value, isLoading: previewValueIsLoading} = useValuePreview({
    enabled: true,
    schemaType,
    value: documentValue,
  })

  const documentTitle = isNewDocument
    ? `New ${schemaType?.title || schemaType?.name}`
    : value?.title || 'Untitled'

  const settled = editState.ready && !previewValueIsLoading

  useEffect(() => {
    if (!settled) return
    // Set the title as the document title
    document.title = `${documentTitle} ${title}`
  }, [documentTitle, title, settled])

  return null
}

const NoDocumentTitle = (props: {title: string}) => {
  const {title} = props
  useEffect(() => {
    // Set the title as the document title
    document.title = title
  }, [title])
  return null
}

export const DeskTitle = (props: DeskTitleProps) => {
  const {resolvedPanes} = props
  const deskToolTitle = useDeskTool().structureContext.title
  // Will show up to the first pane of type document.
  const paneWithTypeDocumentIndex = resolvedPanes.findIndex((pane) => {
    return pane !== LOADING_PANE && pane.type === 'document'
  })
  const paneToShow =
    paneWithTypeDocumentIndex > -1
      ? resolvedPanes[paneWithTypeDocumentIndex]
      : resolvedPanes[resolvedPanes.length - 1]

  const paneTitle = `${
    paneToShow === LOADING_PANE ? '' : paneToShow?.title ?? ''
  } |  ${deskToolTitle}`

  if (!resolvedPanes?.length) return null
  if (paneWithTypeDocumentIndex === -1) return <NoDocumentTitle title={paneTitle} />

  const documentPane = resolvedPanes[paneWithTypeDocumentIndex] as DocumentPaneNode
  if (documentPane.title) return <NoDocumentTitle title={paneTitle} />

  return (
    <DocumentTitle
      title={paneTitle}
      documentId={documentPane.options.id}
      documentType={documentPane.options.type}
    />
  )
}
