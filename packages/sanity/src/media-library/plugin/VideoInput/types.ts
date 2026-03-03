import {
  type Asset,
  type AssetFromSource,
  type AssetSource,
  type AssetSourceUploader,
} from '@sanity/types'

import {type FileInfo} from '../../../core/form/inputs/files/common/styles'
import {type BaseVideoInputProps} from './VideoInput'

export interface VideoAssetInputProps extends Omit<BaseVideoInputProps, 'renderDefault'> {
  clearField: () => void
  hoveringFiles: FileInfo[]
  isBrowseMenuOpen: boolean
  isStale: boolean
  isUploading: boolean
  onCancelUpload?: () => void
  onClearUploadStatus: () => void
  /**
   * Called when user selects to browse/select from an asset source.
   */
  onSelectAssetSourceForBrowse?: (assetSource: AssetSource) => void
  /**
   * Called when an asset source with `uploadMode: 'component'` is selected.
   * The source should be rendered directly to handle file selection and upload internally.
   */
  onOpenSourceForUpload?: (assetSource: AssetSource) => void
  onOpenInSource: (assetSource: AssetSource, asset: Asset) => void
  onSelectAssets: (assetsFromSource: AssetFromSource[]) => void
  onSelectFiles: (assetSource: AssetSource, files: File[]) => void
  onStale: () => void
  selectedAssetSource: AssetSource | null
  setHoveringFiles: (hoveringFiles: FileInfo[]) => void
  setIsBrowseMenuOpen: (isBrowseMenuOpen: boolean) => void
  setIsUploading: (isUploading: boolean) => void
  setSelectedAssetSource: (assetSource: AssetSource | null) => void
  uploader?: AssetSourceUploader
}

export interface VideoPlaybackInfoItemPublic {
  url: string
}

export interface VideoPlaybackInfoItemSigned extends VideoPlaybackInfoItemPublic {
  token: string
}

export type VideoPlaybackInfoItem = VideoPlaybackInfoItemPublic | VideoPlaybackInfoItemSigned

export interface VideoPlaybackInfo<T extends VideoPlaybackInfoItem = VideoPlaybackInfoItem> {
  id: string
  thumbnail: T
  animated: T
  storyboard: T
  stream: T
  duration: number
  aspectRatio: number
}

export type VideoPlaybackInfoSigned = VideoPlaybackInfo<VideoPlaybackInfoItemSigned>

export interface VideoPlaybackTokens {
  animated?: string
  playback?: string
  thumbnail?: string
  storyboard?: string
}

function isSignedPlayback(item: VideoPlaybackInfoItem): item is VideoPlaybackInfoItemSigned {
  return 'token' in item
}

function isSignedPlaybackInfo(
  playbackInfo: VideoPlaybackInfo,
): playbackInfo is VideoPlaybackInfoSigned {
  return isSignedPlayback(playbackInfo.stream)
}

export function getPlaybackTokens(
  playbackInfo: VideoPlaybackInfo,
): VideoPlaybackTokens | undefined {
  if (isSignedPlaybackInfo(playbackInfo)) {
    return {
      animated: playbackInfo.animated.token,
      playback: playbackInfo.stream.token,
      thumbnail: playbackInfo.thumbnail.token,
      storyboard: playbackInfo.storyboard.token,
    }
  }

  return undefined
}
