import {type SanityClient} from '@sanity/client'
import {type Reference, type SanityDocument} from '@sanity/types'
import {useCallback, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {defer, from, type Observable, of, Subject, timer} from 'rxjs'
import {
  catchError,
  map,
  mergeMap,
  retry as retryOperator,
  startWith,
  switchMap,
  timeout,
} from 'rxjs/operators'

import {DEFAULT_API_VERSION} from '../../../core/form/studio/assetSourceMediaLibrary/constants'
import {useClient} from '../../../core/hooks/useClient'
import {type VideoPlaybackInfo} from './types'

const POLLING_DELAY = 2_000
const POLLING_MAX_DURATION = 120_000

class AssetProcessingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AssetProcessingError'
  }
}
interface DocResponse {
  documents: (SanityDocument & {state?: string})[]
}

function isPlaybackNotFoundError(error: unknown): boolean {
  return (error as any)?.statusCode === 404
}

/**
 * Polls the /doc endpoint for an asset until its state is "ready".
 * Retries on "processing" state or if the doc is not found.
 * Throws a fatal error for "failed" state or other errors.
 * This is mainly used for video assets that might take a long time to process.
 */
function pollForReadyState(
  client: SanityClient,
  mediaLibraryId: string,
  assetInstanceId: string,
): Observable<SanityDocument & {state?: string}> {
  return client.observable
    .request<DocResponse>({
      method: 'GET',
      url: `/media-libraries/${mediaLibraryId}/doc/${assetInstanceId}`,
    })
    .pipe(
      mergeMap((response) => {
        const doc = response.documents?.[0]
        if (!doc) {
          throw new Error(`Asset document ${assetInstanceId} not found, retrying...`)
        }
        if (doc.state === 'ready') {
          return of(doc)
        }
        if (doc.state === 'processing') {
          throw new AssetProcessingError('Asset is processing')
        }
        throw new Error(`Asset state is not "ready": ${doc.state || 'unknown'}`)
      }),
      retryOperator({
        delay: (pollError) => {
          if (pollError instanceof AssetProcessingError) {
            return timer(POLLING_DELAY)
          }
          throw pollError
        },
      }),
      timeout(POLLING_MAX_DURATION),
      catchError((err) => {
        if (err.name === 'TimeoutError') {
          throw new Error(`Asset ${assetInstanceId} was not ready processing after 2 minutes.`)
        }
        throw err
      }),
    )
}

/**
 * Parses the asset instance ID from a Media Library GDR
 * @param assetRef - Reference string in format "media-library:ml[id]:[videoAssetInstanceId]"
 * @returns The asset instance ID
 * @throws Error if the reference format is invalid
 */
function parseAssetInstanceId(assetRef: string): string {
  // Check first if we have the asset instance id
  if (assetRef.startsWith('video-')) {
    return assetRef
  }

  const parts = assetRef.split(':')

  if (parts.length !== 3) {
    throw new Error(`Invalid asset reference format: expected 3 parts, got ${parts.length}`)
  }

  const [resourceType, mediaLibraryId, instanceId] = parts

  if (resourceType !== 'media-library') {
    throw new Error(`Invalid resource type: expected "media-library", got "${resourceType}"`)
  }

  if (!mediaLibraryId.startsWith('ml')) {
    throw new Error(
      `Invalid media library ID: expected to start with "ml", got "${mediaLibraryId}"`,
    )
  }

  if (!instanceId) {
    throw new Error('Missing asset instance ID in reference')
  }

  return instanceId
}

export interface UseVideoPlaybackInfoParams {
  mediaLibraryId: string
  assetRef: Reference
}

export type VideoPlaybackInfoLoadable =
  | {isLoading: true; result: undefined; error: undefined; retry: () => void}
  | {isLoading: false; result: VideoPlaybackInfo; error: undefined; retry: () => void}
  | {isLoading: false; result: undefined; error: Error; retry: () => void}
  | {isLoading: false; result: undefined; error: undefined; retry: () => void}

export function useVideoPlaybackInfo(
  params: UseVideoPlaybackInfoParams | null,
): VideoPlaybackInfoLoadable {
  const client = useClient({apiVersion: DEFAULT_API_VERSION})

  const [retrySubject] = useState(() => new Subject<void>())

  const retry = useCallback(() => {
    retrySubject.next()
  }, [retrySubject])

  const [initialState, playbackInfoObservable] = useMemo(() => {
    const loadingState: VideoPlaybackInfoLoadable = {
      isLoading: true,
      result: undefined,
      error: undefined,
      retry,
    }
    const emptyState: VideoPlaybackInfoLoadable = {
      isLoading: false,
      result: undefined,
      error: undefined,
      retry,
    }

    if (!params) {
      return [emptyState, of(emptyState)]
    }

    const {mediaLibraryId, assetRef} = params

    const trigger$ = retrySubject.pipe(startWith(undefined))

    const obs$ = trigger$.pipe(
      switchMap(() =>
        defer(() => {
          const assetInstanceId = parseAssetInstanceId(assetRef._ref)
          return from(
            client.request<VideoPlaybackInfo>({
              uri: `/media-libraries/${mediaLibraryId}/video/${assetInstanceId}/playback-info`,
              tag: 'media-library.video-playback-info',
            }),
          )
        }).pipe(
          map(
            (result) =>
              ({
                isLoading: false,
                result,
                error: undefined,
                retry,
              }) as const,
          ),
          retryOperator({
            delay: (error) => {
              if (!isPlaybackNotFoundError(error)) {
                throw error
              }

              const assetInstanceId = parseAssetInstanceId(assetRef._ref)

              return pollForReadyState(client, mediaLibraryId, assetInstanceId)
            },
          }),
          catchError((err: Error) => {
            console.error('Failed to fetch video playback info:', err)
            return of({
              isLoading: false,
              result: undefined,
              error: err,
              retry,
            } as const)
          }),
          startWith(loadingState),
        ),
      ),
    )

    return [loadingState, obs$]
  }, [params, client, retrySubject, retry])

  return useObservable(playbackInfoObservable, initialState)
}
