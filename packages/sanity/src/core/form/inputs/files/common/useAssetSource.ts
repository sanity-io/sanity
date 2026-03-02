import {
  type Asset,
  type AssetSource,
  type FileSchemaType,
  type ImageSchemaType,
  type SchemaType,
} from '@sanity/types'

import type {PatchEvent} from '../../../patch'
import type {FormPatch} from '../../../patch/types'
import {useAssetSourceActionState} from './useAssetSourceActionState'
import {useAssetSourceUploader} from './useAssetSourceUploader'

export interface UseAssetSourceOptions {
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  schemaType: FileSchemaType | ImageSchemaType | SchemaType
  /** Called when asset limit is exceeded during upload. Used by File/Image inputs. */
  onAssetLimitError?: () => void
  /** Called when upload completes (all-complete). Used by ImageInput for setMenuOpen(false). */
  onAllComplete?: () => void
}

/**
 * Combined hook for asset source state and picker-mode uploader.
 * Composes useAssetSourceActionState and useAssetSourceUploader, wiring the uploader
 * to the state's handleOpenSourceForUpload, resetOnComplete, and setIsUploading.
 *
 * @internal
 */
export function useAssetSource<T = Asset>(options: UseAssetSourceOptions) {
  const {onChange, schemaType, onAssetLimitError, onAllComplete} = options

  const state = useAssetSourceActionState<T>()
  const {
    openForUpload: handleOpenSourceForUpload,
    resetOnComplete: handleAssetSourceResetOnComplete,
    setIsUploading,
  } = state

  const {assetSourceUploader, handleSelectFilesToUpload} = useAssetSourceUploader({
    onChange,
    schemaType,
    handleOpenSourceForUpload,
    handleAssetSourceResetOnComplete,
    setIsUploading,
    onAssetLimitError,
    onAllComplete,
  })

  return {
    ...state,
    assetSourceUploader,
    handleSelectFilesToUpload,
  }
}
