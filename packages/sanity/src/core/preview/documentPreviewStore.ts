import {
  type MutationEvent,
  type QueryParams,
  type SanityClient,
  type StackablePerspective,
  type WelcomeEvent,
} from '@sanity/client'
import {type DocumentSystem, type PrepareViewOptions, type SanityDocument} from '@sanity/types'
import {combineLatest, type Observable} from 'rxjs'
import {distinctUntilChanged, filter, map} from 'rxjs/operators'

import {isRecord} from '../util'
import {
  createDocumentStackAvailabilityObserver,
  createPreviewAvailabilityObserver,
} from './availability'
import {DOCUMENT_SYSTEM_FIELD} from './constants'
import {createGlobalListener} from './createGlobalListener'
import {createObserveDocument, type ObserveDocumentAPIConfig} from './createObserveDocument'
import {createPathObserver} from './createPathObserver'
import {createPreviewObserver} from './createPreviewObserver'
import {createObservePathsDocumentPair} from './documentPair'
import {createDocumentIdSetObserver, type DocumentIdSetObserverState} from './liveDocumentIdSet'
import {
  createDocumentSetObserver,
  type DocumentSetObserverDocumentStub,
  type DocumentSetObserverState,
} from './liveDocumentSet'
import {createObserveFields} from './observeFields'
import {
  type ApiConfig,
  type DocumentStackAvailability,
  type DraftsModelDocument,
  type DraftsModelDocumentAvailability,
  type ObservePathsFn,
  type PreparedSnapshot,
  type Previewable,
  type PreviewableType,
  type PreviewPath,
} from './types'

/**
 * @hidden
 * @beta */
export type ObserveForPreviewFn = (
  value: Previewable,
  type: PreviewableType,
  options?: {
    viewOptions?: PrepareViewOptions
    perspective?: StackablePerspective[]
    apiConfig?: ApiConfig
  },
) => Observable<PreparedSnapshot>

/**
 * The document preview store supports subscribing to content for previewing purposes.
 * Documents observed by this store will be kept in sync and receive real-time updates from all collaborators,
 * but has no support for optimistic updates, so any local edits will require a server round-trip before becoming visible,
 * which means this store is less suitable for real-time editing scenarios.
 *
 * @hidden
 * @beta */
export interface DocumentPreviewStore {
  observePaths: ObservePathsFn
  observeForPreview: ObserveForPreviewFn
  observeDocumentTypeFromId: (
    id: string,
    apiConfig?: ApiConfig,
    perspective?: StackablePerspective[],
  ) => Observable<string | undefined>
  observeDocumentSystemFromId: (
    id: string,
    apiConfig?: ApiConfig,
    perspective?: StackablePerspective[],
  ) => Observable<DocumentSystem | undefined>

  /**
   *
   * @hidden
   * @beta
   */
  unstable_observeDocumentPairAvailability: (
    id: string,
    options?: {version?: string},
  ) => Observable<DraftsModelDocumentAvailability>

  /**
   *
   * @hidden
   * @beta
   */
  unstable_observeDocumentStackAvailability: (
    id: string,
    perspectiveStack: StackablePerspective[],
  ) => Observable<DocumentStackAvailability[]>

  unstable_observePathsDocumentPair: <T extends SanityDocument = SanityDocument>(
    id: string,
    paths: PreviewPath[],
    options?: {version?: string},
  ) => Observable<DraftsModelDocument<T>>

  /**
   * Observes a set of document IDs that matches the given groq-filter. The document ids are returned in ascending order and will update in real-time
   * Whenever a document appears or disappears from the set, a new array with the updated set of IDs will be pushed to subscribers.
   * The query is performed once, initially, and thereafter the set of ids are patched based on the `appear` and `disappear`
   * transitions on the received listener events.
   * This provides a lightweight way of subscribing to a list of ids for simple cases where you just want to subscribe to a set of documents ids
   * that matches a particular filter.
   * @hidden
   * @beta
   * @param filter - A groq filter to use for the document set
   * @param params - Parameters to use with the groq filter
   * @param options - Options for the observer
   * @param apiVersion - Specify the API version to use for the query
   */
  unstable_observeDocumentIdSet: (
    filter: string,
    params?: QueryParams,
    options?: {
      /**
       * Where to insert new items into the set. Defaults to 'sorted' which is based on the lexicographic order of the id
       */
      insert?: 'sorted' | 'prepend' | 'append'
      apiVersion?: string
    },
  ) => Observable<DocumentIdSetObserverState>

  /**
   * Observes a set of documents matching the given groq-filter, projected to the requested fields.
   * Unlike {@link DocumentPreviewStore.unstable_observeDocumentIdSet}, this projects the matching
   * documents in a single query (`*[filter]{...projection}`) The set is fetched once initially and
   * thereafter kept in sync incrementally from listener transitions.
   *
   * @hidden
   * @beta
   * @param filter - A groq filter to use for the document set
   * @param projection - The list of fields to project on each matched document (`_id` is always included)
   * @param params - Parameters to use with the groq filter
   * @param options - Options for the observer
   */
  unstable_observeDocumentSet: <
    T extends DocumentSetObserverDocumentStub = DocumentSetObserverDocumentStub,
  >(
    filter: string,
    projection: string[],
    params?: QueryParams,
    options?: {
      apiVersion?: string
    },
  ) => Observable<DocumentSetObserverState<T>>

  /**
   * Observe a complete document with the given ID
   * @hidden
   * @beta
   */
  unstable_observeDocument: (
    id: string,
    clientConfig?: ObserveDocumentAPIConfig,
  ) => Observable<SanityDocument | undefined>
  /**
   * Observe a list of complete documents with the given IDs
   * @hidden
   * @beta
   */
  unstable_observeDocuments: (
    ids: string[],
    clientConfig?: ObserveDocumentAPIConfig,
  ) => Observable<(SanityDocument | undefined)[]>
}

/** @internal */
export interface DocumentPreviewStoreOptions {
  client: SanityClient
}

/** @internal */
export function createDocumentPreviewStore({
  client,
}: DocumentPreviewStoreOptions): DocumentPreviewStore {
  const versionedClient = client.withConfig({apiVersion: '2025-02-19'})
  const globalListener = createGlobalListener(versionedClient).pipe(
    filter(
      (event): event is MutationEvent | WelcomeEvent =>
        // ignore reconnect events for now until we've verified that downstream consumers can handle them
        event.type === 'mutation' || event.type === 'welcome',
    ),
  )
  const invalidationChannel = globalListener.pipe(
    map((event) => (event.type === 'welcome' ? {type: 'connected' as const} : event)),
  )

  const observeDocument = createObserveDocument({client, mutationChannel: globalListener})
  const observeFields = createObserveFields({client: versionedClient, invalidationChannel})
  const observePaths = createPathObserver({observeFields})

  function observeDocumentTypeFromId(
    id: string,
    apiConfig?: ApiConfig,
    perspective?: StackablePerspective[],
  ): Observable<string | undefined> {
    return observePaths({_type: 'reference', _ref: id}, ['_type'], apiConfig, perspective).pipe(
      map((res) => (isRecord(res) && typeof res._type === 'string' ? res._type : undefined)),
      distinctUntilChanged(),
    )
  }
  function observeDocumentSystemFromId(
    id: string,
    apiConfig?: ApiConfig,
    perspective?: StackablePerspective[],
    // TODO: This shouldn't be undefined once the documents are migrated.
  ): Observable<DocumentSystem | undefined> {
    return observePaths(
      {_type: 'reference', _ref: id},
      [DOCUMENT_SYSTEM_FIELD],
      apiConfig,
      perspective,
    ).pipe(
      map((res) =>
        isRecord(res) && isRecord(res[DOCUMENT_SYSTEM_FIELD])
          ? (res[DOCUMENT_SYSTEM_FIELD] as unknown as DocumentSystem)
          : undefined,
      ),
      distinctUntilChanged(),
    )
  }

  const observeDocumentIdSet = createDocumentIdSetObserver(versionedClient)
  const observeDocumentSet = createDocumentSetObserver(versionedClient)

  const observeForPreview = createPreviewObserver({observeDocumentTypeFromId, observePaths})

  const observeDocumentStackAvailability = createDocumentStackAvailabilityObserver(
    versionedClient,
    observePaths,
  )
  const observeDocumentPairAvailability = createPreviewAvailabilityObserver(
    versionedClient,
    observePaths,
  )

  const observePathsDocumentPair = createObservePathsDocumentPair({
    observeDocumentPairAvailability,
    observePaths,
  })

  // @todo: explain why the API is like this now, and that it should not be like this in the future!

  return {
    observePaths,
    observeForPreview,
    observeDocumentTypeFromId,
    observeDocumentSystemFromId,
    unstable_observeDocumentIdSet: observeDocumentIdSet,
    unstable_observeDocumentSet: observeDocumentSet,
    unstable_observeDocument: observeDocument,
    unstable_observeDocuments: (ids: string[]) =>
      combineLatest(ids.map((id) => observeDocument(id))),
    unstable_observeDocumentPairAvailability: observeDocumentPairAvailability,
    unstable_observeDocumentStackAvailability: observeDocumentStackAvailability,
    unstable_observePathsDocumentPair: observePathsDocumentPair,
  }
}
