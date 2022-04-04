import {Observable} from 'rxjs'
import {distinctUntilChanged, map} from 'rxjs/operators'
import {SanityClient} from '@sanity/client'
import {PrepareViewOptions, SanityDocument} from '@sanity/types'
import {PublishedId} from '../util/draftUtils'
import {isRecord} from '../util/isRecord'
import {isString} from '../util/isString'
import {CrossProjectTokenStore} from '../datastores/crossProjectToken'
import {createPathObserver} from './createPathObserver'
import {createPreviewObserver} from './createPreviewObserver'
import {create_preview_observeFields} from './observeFields'
import {
  ApiConfig,
  DraftsModelDocument,
  DraftsModelDocumentAvailability,
  ObservePathsFn,
  Path,
  PreparedSnapshot,
  Previewable,
  PreviewableType,
} from './types'
import {create_preview_availability} from './availability'
import {create_preview_documentPair} from './documentPair'

export type ObserveForPreviewFn = (
  value: Previewable,
  type: PreviewableType,
  viewOptions?: PrepareViewOptions,
  apiConfig?: ApiConfig
) => Observable<PreparedSnapshot>

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
    id: PublishedId,
    paths: Path[]
  ) => Observable<DraftsModelDocument<T>>
}

interface DocumentPreviewStoreOptions {
  crossProjectTokenStore: CrossProjectTokenStore
  client: SanityClient
}

export function createDocumentPreviewStore({
  crossProjectTokenStore,
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
    crossProjectTokenStore,
    observePaths: __proxy_observePaths,
    versionedClient,
  })

  const {observePaths} = createPathObserver({observeFields})

  function observeDocumentTypeFromId(
    id: string,
    apiConfig?: ApiConfig
  ): Observable<string | undefined> {
    return observePaths(id, ['_type']).pipe(
      map((res) =>
        isRecord(res) && isString((res as any)._type) ? (res as any)._type : undefined
      ),
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
