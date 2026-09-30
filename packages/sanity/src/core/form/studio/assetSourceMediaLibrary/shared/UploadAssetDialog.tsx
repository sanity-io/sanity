import {
  type AssetFromSource,
  type AssetSourceUploader,
  type FileSchemaType,
  type ImageSchemaType,
} from '@sanity/types'
import {useToast} from '@sanity/ui/toast'
import {type ReactNode, useCallback, useEffect, useRef, useState} from 'react'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useAuthType} from '../hooks/useAuthType'
import {useLinkAssets} from '../hooks/useLinkAssets'
import {useMediaLibraryIds} from '../hooks/useMediaLibraryIds'
import {usePluginPostMessage} from '../hooks/usePluginPostMessage'
import {useSanityMediaLibraryConfig} from '../hooks/useSanityMediaLibraryConfig'
import {type AssetSelectionItem, type PluginPostMessage} from '../types'
import {Iframe} from './Iframe'

interface UploadAssetsDialogHandle {
  upload: (files: File[]) => Promise<void>
}

export interface UploadAssetsDialogProps {
  onClose: () => void
  onSelect: (assetFromSource: AssetFromSource[]) => void
  open?: boolean
  uploader?: AssetSourceUploader
  schemaType?: FileSchemaType | ImageSchemaType
}

export function UploadAssetsDialog(props: UploadAssetsDialogProps): ReactNode {
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
  const uploaderRef = useRef<{
    uploader: AssetSourceUploader
    unsubscribe: () => void
  } | null>(null)

  // Terminal statuses (`complete`, `alreadyExists`) from `uploadProgress`
  // messages, held back until the `uploadResponse` message has been handled:
  // writing the last terminal status fires `all-complete`, which makes the
  // Studio input tear this (hidden) iframe down — before the response
  // postMessage carrying the uploaded assets could arrive.
  const pendingTerminalStatusesRef = useRef(
    new Map<string, {status: string; progress?: number; error?: Error}>(),
  )

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

      // The upload is progressing in the iframe, update the uploader files.
      // Already-exists warning toasts are NOT pushed here: they're pushed
      // centrally by `useAssetSourceUploader` in the input when the flushed
      // `alreadyExists` statuses fire `all-complete` (this dialog can be
      // unmounted by then, and a second site would double-toast when it
      // isn't).
      if (message.type === 'uploadProgress' && uploader) {
        message.files.forEach(({id, status, progress, error}) => {
          if (status === 'complete' || status === 'alreadyExists') {
            pendingTerminalStatusesRef.current.set(id, {status, progress, error})
            uploader.updateFile(id, {progress})
            return
          }
          uploader.updateFile(id, {
            status,
            progress,
            error,
          })
        })
      }
      // The upload has completed inside the iframe. Link the assets first
      // (success or failure), then flush the held-back terminal statuses so
      // `all-complete` fires only after the data has landed.
      if (message.type === 'uploadResponse' && uploader) {
        void handleUploaded(message.assets).then(() => {
          pendingTerminalStatusesRef.current.forEach((data, id) => uploader.updateFile(id, data))
          pendingTerminalStatusesRef.current.clear()
        })
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
          // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
          setPageReadyForUploads(false)
        }
      }
      const subscribe = () => {
        return uploader.subscribe((event) => {
          // No already-exists toast handling here: the warning toasts are
          // pushed centrally by `useAssetSourceUploader` in the input (this
          // dialog can be unmounted by the `onSelect` reset before the
          // terminal statuses flush, and a second subscription would
          // double-toast when it isn't).
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
