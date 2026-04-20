import {type PluginPayload, type PluginSelectAssetType} from '@sanity/media-library-types'
import {
  type AssetFromSource,
  type AssetSource,
  type AssetSourceUploader,
  type FileSchemaType,
  type ImageSchemaType,
} from '@sanity/types'
import {Box, Card, Flex, useTheme, useToast} from '@sanity/ui'
import {type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {Button} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {useAuthType} from '../hooks/useAuthType'
import {useLinkAssets} from '../hooks/useLinkAssets'
import {usePluginFrameUrl} from '../hooks/usePluginFrameUrl'
import {usePluginPostMessage} from '../hooks/usePluginPostMessage'
import {useSanityMediaLibraryConfig} from '../hooks/useSanityMediaLibraryConfig'
import {
  type AssetSelectionItem,
  type PluginPostMessage,
  type PluginPostMessageAssetSelection,
} from '../types'
import {AppDialog} from './Dialog'
import {Iframe} from './Iframe'

function selectionMessageToAssetSelectionItems(
  selection: PluginPostMessageAssetSelection['selection'],
): AssetSelectionItem[] {
  return selection.map((item) => {
    const instanceId =
      item.assetInstanceId ??
      (item.asset as {currentVersion?: {_ref?: string}}).currentVersion?._ref
    if (!instanceId) {
      throw new Error('Media Library asset selection missing assetInstanceId')
    }
    return {
      asset: {
        _id: item.asset._id,
        _type: item.asset._type,
        assetType: item.asset.assetType,
      },
      assetInstanceId: instanceId,
    }
  })
}

export interface UploadAssetsDialogProps {
  /**
   * The asset source definition (used to detect `uploadMode: 'component'`).
   * When upload is component-mode we keep the Media Library iframe visible even if
   * an `uploader` is present (e.g. drag-drop from the field streams files in the background).
   */
  assetSource?: AssetSource
  /**
   * MIME type filter for accepted file types (e.g., 'image/*', 'application/pdf').
   * Note: Support depends on the Media Library plugin respecting this filter.
   * For picker mode, the native file picker handles this before files reach the source.
   */
  accept?: string
  onClose: () => void
  onSelect: (assetFromSource: AssetFromSource[]) => void
  schemaType?: FileSchemaType | ImageSchemaType
  selectAssetType?: PluginSelectAssetType
  uploader?: AssetSourceUploader
}

export function UploadAssetsDialog(props: UploadAssetsDialogProps): ReactNode {
  const {accept, schemaType, selectAssetType} = props

  const {onLinkAssets} = useLinkAssets({schemaType})

  const {assetSource, onSelect, onClose, uploader} = props

  const pluginConfig = useSanityMediaLibraryConfig()
  const authType = useAuthType()
  const toast = useToast()
  const {t} = useTranslation()
  const theme = useTheme()
  const {dark} = theme.sanity.color

  const appHost = pluginConfig.__internal.hosts.app

  const params = useMemo<PluginPayload>(
    () =>
      ({
        accept,
        auth: authType,
        disableNavigation: true,
        scheme: dark ? 'dark' : 'light',
        selectAssetTypes: selectAssetType ? [selectAssetType] : [],
        selectionType: 'single',
        /** Media Library reads this so uploads reaching "complete" do not auto-send `uploadResponse`. */
        deferUploadCompletion: assetSource?.uploadMode === 'component',
      }) as PluginPayload,
    [accept, assetSource?.uploadMode, authType, dark, selectAssetType],
  )

  // For component mode (no uploader), we load the upload page which will show its own file picker
  // The scheme param ensures the iframe matches the current theme
  const iframeUrl = usePluginFrameUrl('/upload', params)

  // Visible ML upload dialog: no uploader (choose files only in the iframe), or component-mode
  // sources (real Media Library) which use an uploader only to stream files into the iframe.
  // If `assetSource` is missing, prefer the visible shell so drag-drop + uploader is not stuck hidden.
  const showMediaLibraryUploadDialog =
    !uploader || !assetSource || assetSource.uploadMode === 'component'
  const uploaderRef = useRef<{
    uploader: AssetSourceUploader
    unsubscribe: () => void
  } | null>(null)

  const [pageReadyForUploads, setPageReadyForUploads] = useState(false)
  const [pluginUploadSelection, setPluginUploadSelection] = useState<AssetSelectionItem[]>([])
  const [isConfirmingPluginUpload, setIsConfirmingPluginUpload] = useState(false)
  /** Studio-driven uploads: ids that reached a terminal state in the iframe (`uploadProgress`). */
  const [terminalStudioUploadIds, setTerminalStudioUploadIds] = useState(() => new Set<string>())

  /** When true, closing/unmounting must not abort (upload finished and field was updated). */
  const uploadSucceededRef = useRef(false)

  useEffect(() => {
    uploadSucceededRef.current = false
  }, [uploader])

  useEffect(() => {
    setTerminalStudioUploadIds(new Set())
    setPluginUploadSelection([])
  }, [uploader])

  const handleUploaded = useCallback(
    async (uploadedAssets: AssetSelectionItem[]) => {
      try {
        const assets = await onLinkAssets(uploadedAssets)
        onSelect(assets)
        uploadSucceededRef.current = true
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
      // Initiate the upload if the iframe is ready
      if (message.type === 'pageLoaded' && message.page === 'upload') {
        setPageReadyForUploads(true)
      }

      if (message.type === 'pageUnloaded' && message.page === 'upload') {
        setPageReadyForUploads(false)
      }

      if (message.type === 'assetSelection') {
        try {
          setPluginUploadSelection(selectionMessageToAssetSelectionItems(message.selection))
        } catch {
          setPluginUploadSelection([])
        }
      }

      // The upload is progressing in the iframe, update the uploader files
      if (message.type === 'uploadProgress' && uploader) {
        setTerminalStudioUploadIds((prev) => {
          const next = new Set(prev)
          let changed = false
          for (const {id, status} of message.files) {
            if (
              (status === 'complete' || status === 'error' || status === 'alreadyExists') &&
              !next.has(id)
            ) {
              next.add(id)
              changed = true
            }
          }
          return changed ? next : prev
        })
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
        void handleUploaded(message.assets)
          .then(() => {
            if ('signalCompletion' in uploader && typeof uploader.signalCompletion === 'function') {
              uploader.signalCompletion()
            }
          })
          .finally(() => {
            setIsConfirmingPluginUpload(false)
          })
      }
    },
    [handleUploaded, uploader],
  )

  const {postMessage, setIframe} = usePluginPostMessage(appHost, handlePluginMessage)

  /** User dismissed the dialog without completing an upload — cancel in-flight work and field `_upload`. */
  const handleDismissUpload = useCallback(() => {
    setIsConfirmingPluginUpload(false)
    uploader?.abort()
    onClose()
  }, [onClose, uploader])

  const studioUploadFiles = uploader?.getFiles() ?? []
  const studioUploadsAreTerminal =
    studioUploadFiles.length === 0 ||
    studioUploadFiles.every((file) => terminalStudioUploadIds.has(file.id))

  const canConfirmDeferredPluginUpload =
    assetSource?.uploadMode === 'component' &&
    pluginUploadSelection.length > 0 &&
    studioUploadsAreTerminal

  const handleConfirmPluginUpload = useCallback(() => {
    if (!canConfirmDeferredPluginUpload) {
      return
    }
    setIsConfirmingPluginUpload(true)
    postMessage({type: 'confirmUploadSelection'})
  }, [canConfirmDeferredPluginUpload, postMessage])

  useEffect(() => {
    if (uploader) {
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
  }, [pageReadyForUploads, postMessage, uploader, uploaderRef])

  // Do not abort in an effect cleanup tied to `uploader`: React Strict Mode remounts would call
  // abort() immediately, firing all-complete and closing the dialog before it appears.
  // Explicit dismiss (Cancel / outside click) uses handleDismissUpload; parent teardown is handled
  // by useAssetSourceUploader's cleanup on the asset source uploader state.

  // Component mode: show the iframe in a visible dialog
  // The user will select files directly in the Media Library UI
  if (showMediaLibraryUploadDialog) {
    return (
      <AppDialog
        header={t('asset-sources.media-library.upload-dialog.title')}
        id="media-library-plugin-dialog-upload-assets"
        onClose={handleDismissUpload}
        onClickOutside={handleDismissUpload}
        open
        data-testid="media-library-plugin-dialog-upload-assets"
        width={3}
        footer={
          <Card
            width="full"
            height="fill"
            padding={3}
            shadow={1}
            style={{
              position: 'relative',
              minHeight: '2dvh',
            }}
          >
            <Flex width="full" gap={3} justify="flex-end">
              <Flex width="full" gap={2} justify="flex-end" align="center">
                <Button
                  mode="bleed"
                  onClick={handleDismissUpload}
                  text={t('asset-source.dialog.button.cancel')}
                  size="large"
                />
                {assetSource?.uploadMode === 'component' ? (
                  <Button
                    loading={isConfirmingPluginUpload}
                    disabled={!canConfirmDeferredPluginUpload || isConfirmingPluginUpload}
                    onClick={handleConfirmPluginUpload}
                    text={t('asset-sources.media-library.open-in-source-dialog.button.done')}
                    size="large"
                    tone="primary"
                  />
                ) : null}
              </Flex>
            </Flex>
          </Card>
        }
      >
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            borderTop: '1px solid',
            borderColor: 'var(--card-border-color)',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          <Iframe ref={setIframe} src={iframeUrl} />
        </Box>
      </AppDialog>
    )
  }

  // Picker mode: hidden iframe, files are provided via uploader
  return <Iframe ref={setIframe} src={iframeUrl} hidden />
}
