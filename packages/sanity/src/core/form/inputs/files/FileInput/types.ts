import {
  type AssetFromSource,
  type AssetSource,
  type AssetSourceUploader,
  type FileAsset,
} from '@sanity/types'

import {type FileInfo} from '../common/styles'
import {type AssetAccessPolicy} from '../types'
import {type BaseFileInputProps} from './FileInput'

export interface FileAssetProps extends Omit<BaseFileInputProps, 'renderDefault'> {
  accessPolicy?: AssetAccessPolicy
  browseButtonElementRef: React.RefObject<HTMLButtonElement | null>
  clearField: () => void
  hoveringFiles: FileInfo[]
  isBrowseMenuOpen: boolean
  isStale: boolean
  isUploading: boolean
  onCancelUpload?: () => void
  onClearUploadStatus: () => void
  onOpenInSource: (assetSource: AssetSource, asset: FileAsset) => void
  onSelectAssets: (assetsFromSource: AssetFromSource[]) => void
  onSelectFiles: (assetSource: AssetSource, files: File[]) => void
  onStale: () => void
  selectedAssetSource: AssetSource | null
  setBrowseButtonElement: (element: HTMLButtonElement | null) => void
  setHoveringFiles: (hoveringFiles: FileInfo[]) => void
  setIsBrowseMenuOpen: (isBrowseMenuOpen: boolean) => void
  setIsUploading: (isUploading: boolean) => void
  setSelectedAssetSource: (assetSource: AssetSource | null) => void
  uploader?: AssetSourceUploader
}
