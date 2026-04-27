import {PlayIcon} from '@sanity/icons'
import {Flex, Skeleton} from '@sanity/ui'
import {useMemo} from 'react'

import {type PreviewMediaDimensions} from '../../../core/components/previews'
import {isSignedPlayback} from '../VideoInput/types'
import {
  useVideoPlaybackInfo,
  type UseVideoPlaybackInfoParams,
} from '../VideoInput/useVideoPlaybackInfo'

interface VideoThumbnailProps {
  value: {asset: {_ref: string}}
  dimensions: PreviewMediaDimensions
}

function parseVideoGDR(ref: string): UseVideoPlaybackInfoParams | null {
  const parts = ref.split(':')
  if (parts.length !== 3 || parts[0] !== 'media-library') return null
  return {
    mediaLibraryId: parts[1],
    assetRef: {_type: 'globalDocumentReference', _ref: ref},
  }
}

export function VideoThumbnail({value, dimensions}: VideoThumbnailProps) {
  const params = useMemo(() => {
    if (!value?.asset?._ref) return null
    return parseVideoGDR(value.asset._ref)
  }, [value])

  const playbackInfo = useVideoPlaybackInfo(params)

  if (playbackInfo.isLoading) {
    return <Skeleton animated style={{width: '100%', height: '100%'}} />
  }

  if (!playbackInfo.result) {
    return (
      <Flex align="center" justify="center" style={{width: '100%', height: '100%'}}>
        <PlayIcon />
      </Flex>
    )
  }

  const {thumbnail} = playbackInfo.result
  const baseUrl = thumbnail.url
  const tokenParam = isSignedPlayback(thumbnail) ? `token=${thumbnail.token}` : ''

  const width = dimensions.width ?? 100
  const height = dimensions.height ?? 100
  const dpr = dimensions.dpr ?? 1

  const sizeParams = `width=${width * dpr}&height=${height * dpr}&fit_mode=smartcrop`
  const separator = baseUrl.includes('?') ? '&' : '?'
  const thumbUrl = `${baseUrl}${separator}${[sizeParams, tokenParam].filter(Boolean).join('&')}`

  return (
    <img
      src={thumbUrl}
      alt=""
      referrerPolicy="strict-origin-when-cross-origin"
      style={{width: '100%', height: '100%', objectFit: 'cover'}}
    />
  )
}
