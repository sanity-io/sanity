import {type AssetFromSource, type AssetSource, type AssetSourceUploader} from '@sanity/types'

import {type FileInfo} from '../../../core/form/inputs/files/common/styles'
import {type BaseVideoInputProps} from './VideoInput'

export interface VideoAssetProps extends Omit<BaseVideoInputProps, 'renderDefault'> {
  browseButtonElementRef: React.RefObject<HTMLButtonElement | null>
  clearField: () => void
  hoveringFiles: FileInfo[]
  isBrowseMenuOpen: boolean
  isStale: boolean
  isUploading: boolean
  onCancelUpload?: () => void
  onClearUploadStatus: () => void
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
