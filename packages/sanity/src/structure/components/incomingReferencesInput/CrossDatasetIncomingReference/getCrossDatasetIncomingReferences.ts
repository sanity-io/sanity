import {DocumentIcon} from '@sanity/icons'
import {map, startWith} from 'rxjs'
import {mergeMapArray} from 'rxjs-mergemap-array'
import {
  type DocumentPreviewStore,
  getPreviewPaths,
  prepareForPreview,
  type SanityClient,
} from 'sanity'

import {fetchCrossDatasetReferences} from '../../confirmDeleteDialog/useReferringDocuments'
import {type CrossDatasetIncomingReference} from '../types'

export const INITIAL_STATE = {
  documents: [],
  loading: true,
}

export function getCrossDatasetIncomingReferences({
  documentId,
  type,
  client,
  documentPreviewStore,
  crossDatasetApiConfig,
}: {
  documentId: string
  type: CrossDatasetIncomingReference
  client: SanityClient
  documentPreviewStore: DocumentPreviewStore
  crossDatasetApiConfig: {dataset: string; projectId: string} | undefined
}) {
  // Here we get all the references to this document from the any other dataset
  return fetchCrossDatasetReferences(documentId, {versionedClient: client}).pipe(
    map((references) => {
      if (!references) return []
      // We filter the references so only the references to the current dataset are included and the documentId is not undefined
      return references?.references.filter(
        (reference) => reference.datasetName === type.dataset && reference.documentId,
      ) as {documentId: string; projectId: string; datasetName: string}[]
    }),
    // Now that we have all the references from the dataset the user defined, we need to get the document type from the documentId
    mergeMapArray((document) =>
      documentPreviewStore
        .observeDocumentTypeFromId(document.documentId, crossDatasetApiConfig)
        .pipe(map((documentType) => ({...document, documentType}))),
    ),
    // We filter the documents so only the documents of the type the user defined are included
    map((documents) => documents.filter((document) => document.documentType === type.type)),
    //  Now we get the preview values for the document so we can display it in the preview
    mergeMapArray((document) => {
      const previewPaths = getPreviewPaths(type.preview) || []
      return documentPreviewStore
        .observePaths({_id: document.documentId}, previewPaths, crossDatasetApiConfig)
        .pipe(
          map((result) => {
            const previewValue = prepareForPreview(result, {
              type: type.type,
              title: type.title || '',
              icon: DocumentIcon,
              preview: type.preview,
            })
            return {
              type: type.type,
              id: document.documentId,
              preview: {published: previewValue},
              availability: {available: true, reason: 'READABLE'} as const,
            }
          }),
        )
    }),
    map((documents) => ({documents, loading: false})),
    startWith(INITIAL_STATE),
  )
}
