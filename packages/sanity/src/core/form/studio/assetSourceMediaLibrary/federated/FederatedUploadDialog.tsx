import {type AssetFromSource, type FileSchemaType, type ImageSchemaType} from '@sanity/types'
import {useToast} from '@sanity/ui/toast'
import {type ReactNode, useCallback, useEffect, useMemo, useRef} from 'react'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useColorSchemeValue} from '../../../../studio/colorScheme'
import {useLinkAssets} from '../hooks/useLinkAssets'
import {useMediaLibraryIds} from '../hooks/useMediaLibraryIds'
import {type AssetSelectionItem} from '../types'
import {FederatedViewMount} from './FederatedViewMount'
import {type FederatedAssetSourceView, type FederatedAssetSourceViewProps} from './types'

export interface FederatedUploadDialogProps {
  onClose: () => void
  onSelect: (assetFromSource: AssetFromSource[]) => void
  /** The view failed to load or mount — fall back to the iframe upload dialog. */
  onUnavailable: (reason: unknown) => void
  open?: boolean
  schemaType?: FileSchemaType | ImageSchemaType
  sourceProps: FederatedAssetSourceViewProps
  view: FederatedAssetSourceView
}

/**
 * Headless upload orchestration against the federated view — the federated
 * equivalent of `UploadAssetsDialog`, but with no message protocol: the view
 * shares our window, so it drives `sourceProps.uploader` directly per the
 * `AssetSourceUploader` picker-mode contract (pending files from
 * `getFiles()`, progress and terminal statuses back through `updateFile()`,
 * aborts via `subscribe()`) and reports the uploaded assets through the
 * `onUploadComplete` view prop, which links them and closes the flow. The
 * iframe's `pageLoaded` → `uploadRequest` → `uploadProgress`* →
 * `uploadResponse` postMessage sequence exists only because the uploader
 * object is unreachable across a window boundary.
 *
 * The Studio input owns all progress presentation (via its own uploader
 * subscription in `useAssetSourceUploader`), so the mounted view stays
 * hidden.
 *
 * Must render inside `MediaLibraryProvider` for the library id and link hooks.
 *
 * @internal
 */
export function FederatedUploadDialog(props: FederatedUploadDialogProps): ReactNode {
  const {onClose, onSelect, onUnavailable, open, schemaType, sourceProps, view} = props
  const {uploader} = sourceProps

  const mediaLibraryIds = useMediaLibraryIds()
  const scheme = useColorSchemeValue()
  const {onLinkAssets} = useLinkAssets({schemaType})
  const toast = useToast()
  const {t} = useTranslation()

  // Late-completion guard: the view's upload batch keeps running even if
  // this dialog closes mid-upload (e.g. the user cancels while a file is
  // in flight), and linking into the document after cancel would be wrong.
  const openRef = useRef(open)
  useEffect(() => {
    openRef.current = open
  }, [open])

  const handleUploadComplete = useCallback(
    async (uploadedAssets: AssetSelectionItem[]) => {
      if (!openRef.current) return
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
      // Applies the deferred terminal statuses (`complete`, `alreadyExists`)
      // and fires `all-complete` — after linking (success or failure), so the
      // Studio input doesn't reset the flow before the data lands.
      if (
        uploader &&
        'signalCompletion' in uploader &&
        typeof uploader.signalCompletion === 'function'
      ) {
        uploader.signalCompletion()
      }
    },
    [onLinkAssets, onSelect, onClose, toast, t, uploader],
  )

  // The already-exists warning toasts: `updateFile(…, 'alreadyExists')` from
  // the view is deferred by the uploader until `signalCompletion()`, so the
  // files surface with that status on the `all-complete` event.
  useEffect(() => {
    if (!open || !uploader) return undefined
    return uploader.subscribe((event) => {
      if (event.type === 'all-complete') {
        const existingFiles = event.files.filter((file) => file.status === 'alreadyExists')
        existingFiles.forEach((file) => {
          toast.push({
            status: 'warning',
            title: t('asset-sources.media-library.warning.file-already-exist.title', {
              filename: file.file.name,
            }),
            description: t('asset-sources.media-library.warning.file-already-exist.description'),
            closable: true,
            duration: 10000,
          })
        })
      }
    })
  }, [open, t, toast, uploader])

  const viewProps = useMemo<FederatedAssetSourceViewProps>(
    () => ({
      ...sourceProps,
      libraryId: mediaLibraryIds?.libraryId ?? null,
      onUploadComplete: handleUploadComplete,
      scheme,
    }),
    [sourceProps, mediaLibraryIds?.libraryId, handleUploadComplete, scheme],
  )

  if (!open) {
    return null
  }

  // Headless: the upload page renders no UI worth showing (the Studio input
  // owns progress presentation via `uploader`), same as the hidden iframe.
  return (
    <div hidden>
      <FederatedViewMount onUnavailable={onUnavailable} view={view} viewProps={viewProps} />
    </div>
  )
}
