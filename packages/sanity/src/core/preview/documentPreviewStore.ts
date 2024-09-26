import {type MutationEvent, type SanityClient, type WelcomeEvent} from '@sanity/client'
import {type PrepareViewOptions, type SanityDocument} from '@sanity/types'
import {type Observable} from 'rxjs'
import {distinctUntilChanged, filter, map} from 'rxjs/operators'

import {isRecord} from '../util'
import {createPreviewAvailabilityObserver} from './availability'
import {createGlobalListener} from './createGlobalListener'
import {createPathObserver} from './createPathObserver'
import {createPreviewObserver} from './createPreviewObserver'
import {createObservePathsDocumentPair} from './documentPair'
import {createObserveFields} from './observeFields'
import {
  type ApiConfig,
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
  options?: {viewOptions?: PrepareViewOptions; apiConfig?: ApiConfig},
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
  observeDocumentTypeFromId: (id: string, apiConfig?: ApiConfig) => Observable<string | undefined>

  /**
   *
   * @hidden
   * @beta
   */
  unstable_observeDocumentPairAvailability: (
    id: string,
  ) => Observable<DraftsModelDocumentAvailability>

  unstable_observePathsDocumentPair: <T extends SanityDocument = SanityDocument>(
    id: string,
    paths: PreviewPath[],
  ) => Observable<DraftsModelDocument<T>>
}

/** @internal */
export interface DocumentPreviewStoreOptions {
  client: SanityClient
}

/** @internal */
export function createDocumentPreviewStore({
  client,
}: DocumentPreviewStoreOptions): DocumentPreviewStore {
  const versionedClient = client.withConfig({apiVersion: '1'})
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

  const observeFields = createObserveFields({client: versionedClient, invalidationChannel})
  const observePaths = createPathObserver({observeFields})

  function observeDocumentTypeFromId(
    id: string,
    apiConfig?: ApiConfig,
  ): Observable<string | undefined> {
    return observePaths({_type: 'reference', _ref: id}, ['_type'], apiConfig).pipe(
      map((res) => (isRecord(res) && typeof res._type === 'string' ? res._type : undefined)),
      distinctUntilChanged(),
    )
  }

  const observeForPreview = createPreviewObserver({observeDocumentTypeFromId, observePaths})
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

    unstable_observeDocumentPairAvailability: observeDocumentPairAvailability,
    unstable_observePathsDocumentPair: observePathsDocumentPair,
  }
}
