import {type AssetSourceUploader} from '@sanity/types'
import {useTheme} from '@sanity/ui'
import {type ReactNode, useCallback, useEffect, useState} from 'react'

import {useAuthType} from '../hooks/useAuthType'
import {usePluginPostMessage} from '../hooks/usePluginPostMessage'
import {useSanityMediaLibraryConfig} from '../hooks/useSanityMediaLibraryConfig'
import {type AssetSelectionItem, type PluginPostMessage} from '../types'
import {Iframe} from './Iframe'

export interface UploadAssetsDialogHandle {
  upload: (files: File[]) => Promise<void>
}

export interface UploadAssetsDialogProps {
  libraryId: string
  onUploaded: (selection: AssetSelectionItem[]) => Promise<void>
  open?: boolean
  uploader?: AssetSourceUploader
}

export const UploadAssetsDialog = function UploadAssetsDialog(
  props: UploadAssetsDialogProps,
): ReactNode {
  const theme = useTheme()
  const {dark} = theme.sanity.color

  const {open, onUploaded, libraryId, uploader} = props

  const pluginConfig = useSanityMediaLibraryConfig()
  const authType = useAuthType()

  const appHost = pluginConfig.__internal.hosts.app
  const pluginApiVersion = pluginConfig.__internal.pluginApiVersion
  const appBasePath = pluginConfig.__internal.appBasePath
  const iframeUrl = `${appHost}${appBasePath}/plugin/${pluginApiVersion}/library/${libraryId}/upload?scheme=${dark ? 'dark' : 'light'}&auth=${authType}`

  const [pageReadyForUploads, setPageReadyForUploads] = useState(false)

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
        if (onUploaded) onUploaded(message.assets)
      }
    },
    [onUploaded, open, uploader],
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
    return undefined
  }, [open, pageReadyForUploads, postMessage, uploader])

  if (!open) {
    return null
  }

  return <Iframe ref={setIframe} src={iframeUrl} hidden />
}
