import {Observable} from 'rxjs'
import {distinctUntilChanged, map} from 'rxjs/operators'
import {SanityClient} from '@sanity/client'
import {PrepareViewOptions, SanityDocument} from '@sanity/types'
import {isRecord} from '../util'
import {create_preview_availability} from './availability'
import {createPathObserver} from './createPathObserver'
import {createPreviewObserver} from './createPreviewObserver'
import {create_preview_documentPair} from './documentPair'
import {create_preview_observeFields} from './observeFields'
import {
  ApiConfig,
  DraftsModelDocument,
  DraftsModelDocumentAvailability,
  ObservePathsFn,
  PreparedSnapshot,
  Previewable,
  PreviewableType,
  PreviewPath,
} from './types'

/** @beta */
export type ObserveForPreviewFn = (
  value: Previewable,
  type: PreviewableType,
  viewOptions?: PrepareViewOptions,
  apiConfig?: ApiConfig
) => Observable<PreparedSnapshot>

/** @beta */
export interface DocumentPreviewStore {
  observePaths: ObservePathsFn
  observeForPreview: ObserveForPreviewFn
  observeDocumentTypeFromId: (id: string, apiConfig?: ApiConfig) => Observable<string | undefined>

  /**
   * @beta
   */
  unstable_observeDocumentPairAvailability: (
    id: string
  ) => Observable<DraftsModelDocumentAvailability>

  unstable_observePathsDocumentPair: <T extends SanityDocument = SanityDocument>(
    id: string,
    paths: PreviewPath[]
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

  // NOTE: this is workaroudn for circumventing a circular dependency between `observePaths` and
  // `observeFields`.
  // eslint-disable-next-line camelcase
  const __proxy_observePaths: ObservePathsFn = (value, paths, apiConfig) => {
    return observePaths(value, paths, apiConfig)
  }

  const {observeFields} = create_preview_observeFields({
    observePaths: __proxy_observePaths,
    versionedClient,
  })

  const {observePaths} = createPathObserver({observeFields})

  function observeDocumentTypeFromId(
    id: string,
    apiConfig?: ApiConfig
  ): Observable<string | undefined> {
    return observePaths({_type: 'reference', _ref: id}, ['_type'], apiConfig).pipe(
      map((res) => (isRecord(res) && typeof res._type === 'string' ? res._type : undefined)),
      distinctUntilChanged()
    )
  }

  // const {createPreviewObserver} = create_preview_createPreviewObserver(observeDocumentTypeFromId)
  const observeForPreview = createPreviewObserver({observeDocumentTypeFromId, observePaths})
  const {observeDocumentPairAvailability} = create_preview_availability(
    versionedClient,
    observePaths
  )
  const {observePathsDocumentPair} = create_preview_documentPair(versionedClient, observePaths)

  // @todo: explain why the API is like this now, and that it should not be like this in the future!
  return {
    observePaths,
    observeForPreview,
    observeDocumentTypeFromId,

    // eslint-disable-next-line camelcase
    unstable_observeDocumentPairAvailability: observeDocumentPairAvailability,
    unstable_observePathsDocumentPair: observePathsDocumentPair,
  }
}
