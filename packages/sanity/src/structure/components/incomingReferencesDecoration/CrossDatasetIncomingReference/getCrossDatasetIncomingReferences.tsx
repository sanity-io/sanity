import {DocumentIcon} from '@sanity/icons'
import {type PreviewValue} from '@sanity/types'
import {map, type Observable, of, startWith} from 'rxjs'
import {mergeMapArray} from 'rxjs-mergemap-array'
import {
  type DocumentAvailability,
  type DocumentPreviewStore,
  getPreviewPaths,
  getPublishedId,
  isNonNullable,
  prepareForPreview,
  type SanityClient,
} from 'sanity'

import {fetchCrossDatasetReferences} from '../../confirmDeleteDialog/useReferringDocuments'
import {type CrossDatasetIncomingReference} from '../types'

export const INITIAL_STATE = {
  documents: [],
  loading: true,
}

interface InputIncomingReferencesOptions {
  documentId: string
  type: CrossDatasetIncomingReference
  client: SanityClient
  documentPreviewStore: DocumentPreviewStore
}
interface InspectorIncomingReferencesOptions {
  documentId: string
  client: SanityClient
  documentPreviewStore: DocumentPreviewStore
  type?: undefined
}

interface CompleteReferencesResponse {
  documentId: string
  projectId: string
  datasetName: string
}

export interface CrossDatasetIncomingReferenceDocument {
  id: string
  type: string
  availability: DocumentAvailability | null
  preview: {
    published: PreviewValue | undefined
  }
  projectId: string
  dataset: string
}
export function getCrossDatasetIncomingReferences({
  documentId,
  type,
  client,
  documentPreviewStore,
}: InputIncomingReferencesOptions | InspectorIncomingReferencesOptions): Observable<{
  documents: CrossDatasetIncomingReferenceDocument[]
  loading: boolean
}> {
  // Here we get all the references to this document from the any other dataset
  return fetchCrossDatasetReferences(documentId, {versionedClient: client}).pipe(
    map((result) => {
      if (!result) return []
      if (!type?.dataset) {
        // Return all the references that contain a datasetName and a documentId.
        return result.references.filter(
          (ref) => ref.documentId && ref.datasetName,
        ) as CompleteReferencesResponse[]
      }
      // Return all the references with document id and where the datasetName matches with the dataset provided.
      return result.references.filter(
        (ref) => ref.datasetName === type.dataset && ref.documentId,
      ) as CompleteReferencesResponse[]
    }),
    // Now that we have all the references from the dataset the user defined, we need to get the document type from the documentId
    mergeMapArray((document) =>
      documentPreviewStore
        .observeDocumentTypeFromId(getPublishedId(document.documentId), {
          dataset: document.datasetName,
          projectId: document.projectId,
        })
        .pipe(map((documentType) => ({...document, documentType}))),
    ),

    mergeMapArray((document) => {
      if (!document.documentType) return of(null)
      if (!type) {
        // If we don't have a type defined with the preview we can't derive how the document preview will look
        // So let's use the document Id as the title, dataset name as subtitle and a default icon.
        // as next step we will implement an option to configure the inspector and provide a preview and url config
        // for each of the types.
        return of({
          type: document.documentType,
          id: document.documentId,
          preview: {
            published: {
              _id: document.documentId,
              title: `Document Id: ${document.documentId}`,
              subtitle: `Dataset: ${document.datasetName} - Project Id: ${document.projectId}`,
              media: <DocumentIcon />,
            } as PreviewValue,
          },
          availability: {available: true, reason: 'READABLE'} as const,
          projectId: document.projectId,
          dataset: document.datasetName,
        })
      }

      // We filter the documents so only the documents of the type the user defined are included
      if (document.documentType !== type.type) return of(null)
      const previewPaths = getPreviewPaths(type.preview) || []
      //  Now we get the preview values for the document so we can display it in the preview
      return documentPreviewStore
        .observePaths({_id: getPublishedId(document.documentId)}, previewPaths, {
          dataset: document.datasetName,
          projectId: document.projectId,
        })
        .pipe(
          map((result) => {
            const previewValue = prepareForPreview(result, {
              type: type.type,
              title: type.title || '',
              icon: () => <DocumentIcon />,
              preview: type.preview,
            })
            return {
              type: document.documentType as string,
              id: document.documentId,
              preview: {
                published: {
                  ...previewValue,
                  media: previewValue.media ?? <DocumentIcon />,
                },
              },
              availability: {available: true, reason: 'READABLE'} as const,
              projectId: document.projectId,
              dataset: document.datasetName,
            }
          }),
        )
    }),
    map((documents) => ({documents: documents.filter(isNonNullable), loading: false})),
    startWith(INITIAL_STATE),
  )
}
