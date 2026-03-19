import {type SanityClient} from '@sanity/client'
import {type Asset, type FileSchemaType, type ImageSchemaType, type SchemaType} from '@sanity/types'
import {useCallback, useRef} from 'react'

import type {PatchEvent} from '../../../patch/PatchEvent'
import {type FormPatch} from '../../../patch/types'
import {useAssetSourceActionState} from './useAssetSourceActionState'
import {useAssetSourceUploader} from './useAssetSourceUploader'
import {useUploadExternalFileToDataset} from './useUploadExternalFileToDataset'

export interface UseAssetSourceOptions {
  client: SanityClient
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
 * Returns a close handler that restores focus to the menu button when the asset source dialog closes.
 *
 * @internal
 */
export function useAssetSource<T = Asset>(options: UseAssetSourceOptions) {
  const {client, onChange, schemaType, onAssetLimitError, onAllComplete} = options

  const state = useAssetSourceActionState<T>()
  const {
    close: assetSourceClose,
    openForUpload: handleOpenSourceForUpload,
    resetOnComplete: handleAssetSourceResetOnComplete,
    setIsUploading,
  } = state

  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const close = useCallback(() => {
    assetSourceClose()
    menuButtonRef.current?.focus()
  }, [assetSourceClose])

  const {assetSourceUploader, handleSelectFilesToUpload} = useAssetSourceUploader({
    onChange,
    schemaType,
    handleOpenSourceForUpload,
    handleAssetSourceResetOnComplete,
    setIsUploading,
    onAssetLimitError,
    onAllComplete,
  })

  const {uploadWith, clearUploadStatus} = useUploadExternalFileToDataset({
    client,
    schemaType,
    onChange,
    setIsUploading,
  })

  return {
    ...state,
    close,
    menuButtonRef,
    assetSourceUploader,
    handleSelectFilesToUpload,
    uploadWith,
    clearUploadStatus,
  }
}
