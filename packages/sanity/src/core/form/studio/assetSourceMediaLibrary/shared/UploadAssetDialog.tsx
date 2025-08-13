import {
  type AssetFromSource,
  type AssetSourceUploader,
  type FileSchemaType,
  type ImageSchemaType,
} from '@sanity/types'
import {useTheme, useToast} from '@sanity/ui'
import {createRef, type ReactNode, useCallback, useEffect, useState} from 'react'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useAuthType} from '../hooks/useAuthType'
import {useLinkAssets} from '../hooks/useLinkAssets'
import {useMediaLibraryIds} from '../hooks/useMediaLibraryIds'
import {usePluginPostMessage} from '../hooks/usePluginPostMessage'
import {useSanityMediaLibraryConfig} from '../hooks/useSanityMediaLibraryConfig'
import {type AssetSelectionItem, type PluginPostMessage} from '../types'
import {Iframe} from './Iframe'

export interface UploadAssetsDialogHandle {
  upload: (files: File[]) => Promise<void>
}

export interface UploadAssetsDialogProps {
  onClose: () => void
  onSelect: (assetFromSource: AssetFromSource[]) => void
  open?: boolean
  uploader?: AssetSourceUploader
  schemaType?: FileSchemaType | ImageSchemaType
}

export const UploadAssetsDialog = function UploadAssetsDialog(
  props: UploadAssetsDialogProps,
): ReactNode {
  const theme = useTheme()
  const mediaLibraryIds = useMediaLibraryIds()
  const {schemaType} = props

  const {onLinkAssets} = useLinkAssets({schemaType})

  const {open, onSelect, onClose, uploader} = props

  const pluginConfig = useSanityMediaLibraryConfig()
  const authType = useAuthType()
  const toast = useToast()
  const {t} = useTranslation()

  const appHost = pluginConfig.__internal.hosts.app
  const appBasePath = pluginConfig.__internal.appBasePath
  const iframeUrl = `${appHost}${appBasePath}/plugin/v1/library/${mediaLibraryIds?.libraryId}/upload?auth=${authType}`
  const uploaderRef = createRef<{
    uploader: AssetSourceUploader
    unsubscribe: () => void
  }>()

  const [pageReadyForUploads, setPageReadyForUploads] = useState(false)

  const handleUploaded = useCallback(
    async (uploadedAssets: AssetSelectionItem[]) => {
      try {
        const assets = await onLinkAssets(uploadedAssets)
        onSelect(assets)
        onClose()
      } catch (error) {
        toast.push({
          closable: true,
          status: 'error',
          id: 'insert-asset-error',
          title: t('asset-source.dialog.insert-asset-error'),
        })
        console.error(error)
      }
    },
    [onLinkAssets, onSelect, onClose, toast, t],
  )

  const handlePluginMessage = useCallback(
    (message: PluginPostMessage) => {
      if (!open) return
      // Initiate the upload if the iframe is ready
      if (message.type === 'pageLoaded' && message.page === 'upload') {
        setPageReadyForUploads(true)
      }

      if (message.type === 'pageUnloaded' && message.page === 'upload') {
        setPageReadyForUploads(false)
      }

      // The upload is progressing in the iframe, update the uploader files
      if (message.type === 'uploadProgress' && uploader) {
        message.files.forEach(({id, status, progress, error}) => {
          uploader.updateFile(id, {
            status,
            progress,
            error,
          })
        })
      }
      // The upload has completed inside the iframe
      if (message.type === 'uploadResponse' && uploader) {
        handleUploaded(message.assets)
      }
    },
    [handleUploaded, open, uploader],
  )

  const {postMessage, setIframe} = usePluginPostMessage(appHost, handlePluginMessage)

  useEffect(() => {
    if (open && uploader) {
      if (pageReadyForUploads) {
        if (
          uploader.getFiles().length > 0 &&
          uploader.getFiles().every((file) => file.status === 'pending')
        ) {
          postMessage({
            type: 'uploadRequest',
            files: uploader.getFiles(),
          })
          setPageReadyForUploads(false)
        }
      }
      const subscribe = () => {
        return uploader.subscribe((event) => {
          if (event.type === 'status' && event.status === 'aborted') {
            postMessage({
              type: 'abortUploadRequest',
              files: [
                {
                  id: event.file.id,
                },
              ],
            })
          }
        })
      }
      uploaderRef.current = {
        uploader,
        unsubscribe: subscribe(),
      }
      return uploaderRef.current.unsubscribe
    }
    return uploaderRef.current?.unsubscribe()
  }, [open, pageReadyForUploads, postMessage, uploader, uploaderRef])

  if (!open) {
    return null
  }

  return <Iframe ref={setIframe} src={iframeUrl} hidden />
}
