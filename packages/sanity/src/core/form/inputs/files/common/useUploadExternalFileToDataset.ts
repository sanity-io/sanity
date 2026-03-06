import {type SanityClient} from '@sanity/client'
import {type SchemaType} from '@sanity/types'
import {useToast} from '@sanity/ui'
import get from 'lodash-es/get.js'
import {useCallback, useRef} from 'react'

import {useTranslation} from '../../../../i18n'
import {type FormPatch, PatchEvent, setIfMissing, unset} from '../../../patch'
import {type Uploader, type UploadOptions} from '../../../studio/uploads/types'

export interface UseUploadExternalFileToDatasetOptions {
  client: SanityClient
  schemaType: SchemaType
  onChange: (patch: FormPatch | FormPatch[] | PatchEvent) => void
  setIsUploading: (uploading: boolean) => void
  /** i18n key for error toast title. Default: 'inputs.file.upload-failed.title' */
  uploadFailedTitleKey?: string
  /** i18n key for error toast description. Default: 'inputs.file.upload-failed.description' */
  uploadFailedDescriptionKey?: string
}

/**
 * Hook that returns an uploadWith callback for uploading external files to the dataset.
 * Used when selecting file/base64/url assets from an asset source.
 *
 * @internal
 */
export function useUploadExternalFileToDataset(options: UseUploadExternalFileToDatasetOptions) {
  const {
    client,
    schemaType,
    onChange,
    setIsUploading,
    uploadFailedTitleKey = 'inputs.file.upload-failed.title',
    uploadFailedDescriptionKey = 'inputs.file.upload-failed.description',
  } = options

  const {push} = useToast()
  const {t} = useTranslation()
  const uploadSubscriptionRef = useRef<{unsubscribe: () => void} | null>(null)

  const clearUploadStatus = useCallback(() => {
    onChange(PatchEvent.from([unset(['_upload'])]))
  }, [onChange])

  const cancelUpload = useCallback(() => {
    uploadSubscriptionRef.current?.unsubscribe()
    uploadSubscriptionRef.current = null
    clearUploadStatus()
  }, [clearUploadStatus])

  const uploadWith = useCallback(
    (uploader: Uploader, file: globalThis.File, assetDocumentProps: UploadOptions = {}) => {
      const {source} = assetDocumentProps
      const uploadOptions = {
        metadata: get(schemaType, 'options.metadata'),
        storeOriginalFilename: get(schemaType, 'options.storeOriginalFilename'),
        source,
      }

      cancelUpload()
      setIsUploading(true)
      onChange(PatchEvent.from([setIfMissing({_type: schemaType.name})]))

      uploadSubscriptionRef.current = uploader
        .upload(client, file, schemaType, uploadOptions)
        .subscribe({
          next: (uploadEvent) => {
            if (uploadEvent.patches) {
              onChange(PatchEvent.from(uploadEvent.patches))
            }
          },
          error: (err) => {
            console.error(err)
            push({
              status: 'error',
              description: t(uploadFailedDescriptionKey),
              title: t(uploadFailedTitleKey),
            })
            clearUploadStatus()
          },
          complete: () => {
            setIsUploading(false)
          },
        })
    },
    [
      cancelUpload,
      clearUploadStatus,
      client,
      onChange,
      push,
      schemaType,
      setIsUploading,
      t,
      uploadFailedDescriptionKey,
      uploadFailedTitleKey,
    ],
  )

  return {uploadWith, cancelUpload, clearUploadStatus}
}
