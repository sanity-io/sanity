import {PlayIcon} from '@sanity/icons/Play'
import {Skeleton} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {Flex} from 'ui5'

import {type PreviewMediaDimensions} from '../../../core/components/previews/types'
import {
  useVideoPlaybackInfo,
  type UseVideoPlaybackInfoParams,
  type VideoPlaybackInfoLoadable,
} from '../VideoInput/useVideoPlaybackInfo'
import {parseVideoAssetSource, type VideoAssetSource} from './isVideoAssetSource'

export interface VideoThumbnailProps {
  value: VideoAssetSource
  dimensions: PreviewMediaDimensions
}

export function getVideoThumbnailParams(
  value: VideoAssetSource,
  dimensions: PreviewMediaDimensions,
): UseVideoPlaybackInfoParams | null {
  const parsed = parseVideoAssetSource(value)
  if (!parsed) return null

  const dpr = dimensions.dpr ?? 1
  return {
    ...parsed,
    thumbnail: {
      width: Math.ceil((dimensions.width ?? 100) * dpr),
      height: Math.ceil((dimensions.height ?? 100) * dpr),
      fit: 'smartcrop',
    },
  }
}

function ThumbnailFallback() {
  return (
    <Flex
      alignItems="center"
      data-testid="video-thumbnail-fallback"
      justifyContent="center"
      style={{width: '100%', height: '100%'}}
    >
      <PlayIcon />
    </Flex>
  )
}

function getThumbnailUrl(thumbnail: {url: string; token?: string}): string | null {
  try {
    const url = new URL(thumbnail.url)
    if (thumbnail.token) url.searchParams.set('token', thumbnail.token)
    return url.toString()
  } catch {
    return null
  }
}

export function VideoThumbnailContent({state}: {state: VideoPlaybackInfoLoadable}) {
  const thumbnailUrl = state.result ? getThumbnailUrl(state.result.thumbnail) : null
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (state.isLoading) {
    return (
      <Skeleton
        animated
        data-testid="video-thumbnail-loading"
        style={{width: '100%', height: '100%'}}
      />
    )
  }

  if (!thumbnailUrl || failedUrl === thumbnailUrl) return <ThumbnailFallback />

  return (
    <img
      src={thumbnailUrl}
      alt=""
      data-testid="video-thumbnail-image"
      onError={() => setFailedUrl(thumbnailUrl)}
      referrerPolicy="strict-origin-when-cross-origin"
      style={{width: '100%', height: '100%', objectFit: 'cover'}}
    />
  )
}

export function VideoThumbnail({value, dimensions}: VideoThumbnailProps) {
  // Rebuild from asset ref + size primitives so preview prepare() object churn
  // does not recreate params and refetch playback-info.
  const assetRef = value.asset._ref
  const {width, height, dpr} = dimensions
  const params = useMemo(
    () =>
      getVideoThumbnailParams(
        {_type: 'sanity.video', asset: {_type: 'globalDocumentReference', _ref: assetRef}},
        {width, height, dpr},
      ),
    [assetRef, width, height, dpr],
  )
  const playbackInfo = useVideoPlaybackInfo(params)

  return <VideoThumbnailContent state={playbackInfo} />
}
