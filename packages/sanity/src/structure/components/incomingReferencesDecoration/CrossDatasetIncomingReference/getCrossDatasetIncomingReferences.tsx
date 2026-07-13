import {DocumentIcon} from '@sanity/icons/Document'
import {type PreviewValue} from '@sanity/types'
import {catchError, map, type Observable, of, startWith, switchMap} from 'rxjs'
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

const INITIAL_STATE = {
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
  // Here we get all the references to this document from the any other dataset.
  // `fetchCrossDatasetReferences` is poll-driven (it re-emits on visibility
  // changes), so we run the per-emission pipeline inside a `switchMap` and catch
  // there. That way a transient failure of a single poll degrades to an empty
  // list without completing the outer observable, allowing a later poll tick to
  // recover. Consumers render this via `useObservable`, which rethrows stream
  // errors during render and would crash the document pane.
  return fetchCrossDatasetReferences(documentId, {versionedClient: client}).pipe(
    switchMap((referencesResult) =>
      of(referencesResult).pipe(
        map((res) => {
          if (!res) return []
          if (!type?.dataset) {
            // Return all the references that contain a datasetName and a documentId.
            return res.references.filter(
              (ref) => ref.documentId && ref.datasetName,
            ) as CompleteReferencesResponse[]
          }
          // Return all the references with document id and where the datasetName matches with the dataset provided.
          return res.references.filter(
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
        // Cross-dataset queries are failure-prone (token / dataset permission
        // errors). Degrade this poll tick to an empty list instead of erroring;
        // catching inside the `switchMap` keeps the outer stream alive so a
        // later poll can recover.
        catchError((err) => {
          console.error(new Error('Failed to load cross-dataset incoming references', {cause: err}))
          return of({documents: [], loading: false})
        }),
      ),
    ),
    startWith(INITIAL_STATE),
  )
}
