import {type Reference} from '@sanity/types'
import {useCallback, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {from, of} from 'rxjs'
import {catchError, map, startWith} from 'rxjs/operators'

import {DEFAULT_API_VERSION} from '../../../core/form/studio/assetSourceMediaLibrary/constants'
import {useClient} from '../../../core/hooks/useClient'
import {type VideoPlaybackInfo} from './types'

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

// eslint-disable-next-line no-empty-function
const noop = () => {}

const INITIAL_LOADING_STATE: VideoPlaybackInfoLoadable = {
  isLoading: true,
  result: undefined,
  error: undefined,
  retry: noop,
}

const EMPTY_STATE: VideoPlaybackInfoLoadable = {
  isLoading: false,
  result: undefined,
  error: undefined,
  retry: noop,
}

export function useVideoPlaybackInfo(
  params: UseVideoPlaybackInfoParams | null,
): VideoPlaybackInfoLoadable {
  const client = useClient({apiVersion: DEFAULT_API_VERSION})
  const [retryAttempt, setRetryAttempt] = useState<number>(0)

  const retry = useCallback(() => {
    setRetryAttempt((current) => current + 1)
  }, [])

  const mlClient = useMemo(() => {
    if (!params) {
      return null
    }
    return client.withConfig({
      apiVersion: DEFAULT_API_VERSION,
      requestTagPrefix: 'sanity.studio.mediaLibrary.videoPlaybackInfo',
    })
  }, [client, params])

  const playbackInfoObservable = useMemo(() => {
    if (!params || !mlClient) {
      return of(EMPTY_STATE)
    }

    try {
      const assetInstanceId = parseAssetInstanceId(params.assetRef._ref)

      return from(
        mlClient.request<VideoPlaybackInfo>({
          uri: `/media-libraries/${params.mediaLibraryId}/video/${assetInstanceId}/playback-info`,
        }),
      ).pipe(
        map(
          (result) =>
            ({
              isLoading: false,
              result,
              error: undefined,
              retry,
              retryAttempt,
            }) as const,
        ),
        startWith(INITIAL_LOADING_STATE),
        catchError((err: Error) => {
          console.error('Failed to fetch video playback info:', err)
          return of({
            isLoading: false,
            result: undefined,
            error: err,
            retry,
            retryAttempt,
          } as const)
        }),
      )
    } catch (err) {
      console.error('Invalid asset reference:', err)
      return of({
        isLoading: false,
        result: undefined,
        error: err instanceof Error ? err : new Error('Invalid asset reference'),
        retry,
        retryAttempt,
      } as const)
    }
  }, [params, mlClient, retry, retryAttempt])

  return useObservable(playbackInfoObservable, INITIAL_LOADING_STATE)
}
