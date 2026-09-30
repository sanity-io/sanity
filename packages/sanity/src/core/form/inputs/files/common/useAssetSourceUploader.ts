import {
  type AssetSource,
  type AssetSourceUploader,
  type FileSchemaType,
  type ImageSchemaType,
  type SchemaType,
} from '@sanity/types'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useEffect, useState} from 'react'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {isAssetLimitError} from '../../../../limits/context/assets/isAssetLimitError'
import {set, unset} from '../../../patch/patch'
import {PatchEvent} from '../../../patch/PatchEvent'
import {type FormPatch} from '../../../patch/types'
import {UPLOAD_STATUS_KEY} from '../../../studio/uploads/constants'
import {createInitialUploadPatches} from '../../../studio/uploads/utils'

export interface UseAssetSourceUploaderOptions {
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  schemaType: FileSchemaType | ImageSchemaType | SchemaType
  handleOpenSourceForUpload: (assetSource: AssetSource) => void
  handleAssetSourceResetOnComplete: () => void
  setIsUploading: (uploading: boolean) => void
  /** Called when asset limit is exceeded during upload. Used by File/Image inputs. */
  onAssetLimitError?: () => void
  /** Called when upload completes (all-complete). Used by ImageInput for setMenuOpen(false). */
  onAllComplete?: () => void
}

/**
 * Shared hook for handling asset source picker-mode uploads (Uploader class).
 * Manages uploader subscription, progress reporting, and error handling.
 *
 * @internal
 */
export function useAssetSourceUploader(options: UseAssetSourceUploaderOptions) {
  const {
    onChange,
    schemaType,
    handleOpenSourceForUpload,
    handleAssetSourceResetOnComplete,
    setIsUploading,
    onAssetLimitError,
    onAllComplete,
  } = options

  const {push} = useToast()
  const {t} = useTranslation()

  const [assetSourceUploader, setAssetSourceUploader] = useState<{
    unsubscribe: () => void
    uploader: AssetSourceUploader
  } | null>(null)

  useEffect(() => {
    return () => {
      assetSourceUploader?.uploader?.abort()
      assetSourceUploader?.unsubscribe()
    }
  }, [assetSourceUploader])

  const handleSelectFilesToUpload = useCallback(
    (assetSource: AssetSource, files: File[]) => {
      if (files.length === 0) return

      handleOpenSourceForUpload(assetSource)

      if (!assetSource.Uploader) return

      const uploader = new assetSource.Uploader()
      assetSourceUploader?.unsubscribe()

      try {
        setAssetSourceUploader({
          unsubscribe: uploader.subscribe((event) => {
            switch (event.type) {
              case 'progress':
                onChange(
                  PatchEvent.from([
                    set(Math.max(2, event.progress), [UPLOAD_STATUS_KEY, 'progress']),
                    set(new Date().toISOString(), [UPLOAD_STATUS_KEY, 'updatedAt']),
                  ]),
                )
                break
              case 'error':
                event.files.forEach((file) => console.error(file.error))
                push({
                  status: 'error',
                  description: t('asset-sources.common.uploader.upload-failed.description'),
                  title: t('asset-sources.common.uploader.upload-failed.title'),
                })
                break
              case 'all-complete': {
                if (onAssetLimitError && event.files) {
                  const hasAssetLimitError = event.files.some(
                    (file) => file.status === 'error' && isAssetLimitError(file.error),
                  )
                  if (hasAssetLimitError) onAssetLimitError()
                }
                // Duplicate-detection warnings ("file already exists, using
                // the existing one") must be pushed from here: the source's
                // own components are unmounted by the `onSelect` reset before
                // the terminal statuses land, so a subscription there never
                // sees this event.
                event.files
                  ?.filter((file) => file.status === 'alreadyExists')
                  .forEach((file) => {
                    push({
                      status: 'warning',
                      title: t('asset-sources.media-library.warning.file-already-exist.title', {
                        filename: file.file.name,
                      }),
                      description: t(
                        'asset-sources.media-library.warning.file-already-exist.description',
                      ),
                      closable: true,
                      duration: 10000,
                    })
                  })
                onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]))
                onAllComplete?.()
                handleAssetSourceResetOnComplete()
                break
              }
              default:
            }
          }),
          uploader,
        })
        setIsUploading(true)
        onChange(PatchEvent.from(createInitialUploadPatches(files[0])))
        uploader.upload(files, {schemaType, onChange: onChange as (patch: unknown) => void})
      } catch (err) {
        onChange(PatchEvent.from([unset([UPLOAD_STATUS_KEY])]))
        handleAssetSourceResetOnComplete()
        assetSourceUploader?.unsubscribe()
        setAssetSourceUploader(null)
        push({
          status: 'error',
          description: t('asset-sources.common.uploader.upload-failed.description'),
          title: t('asset-sources.common.uploader.upload-failed.title'),
        })
        console.error(err)
      }
    },
    [
      assetSourceUploader,
      handleAssetSourceResetOnComplete,
      handleOpenSourceForUpload,
      onChange,
      onAllComplete,
      onAssetLimitError,
      push,
      schemaType,
      setIsUploading,
      t,
    ],
  )

  return {assetSourceUploader, handleSelectFilesToUpload}
}
