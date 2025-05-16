import {
  type AssetFromSource,
  type AssetSourceComponentProps,
  type ImageMetadataType,
  isImageSchemaType,
  type SanityDocument,
} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {type ForwardedRef, forwardRef, memo, useCallback, useState} from 'react'

import {useClient} from '../../../../hooks'
import {useTranslation} from '../../../../i18n'
import {DEFAULT_API_VERSION} from '../constants'
import {type AssetSelectionItem} from '../types'
import {EnsureMediaLibrary} from './EnsureMediaLibrary'
import {SelectAssetsDialog, type SelectAssetsDialogProps} from './SelectAssetsDialog'
import {UploadAssetsDialog} from './UploadAssetDialog'

// Cache for fetched Media Library ID when 'libraryId' is not specified in the config.
const fetchedLibraryIdCache = new Map<string, string>()

const MediaLibraryAssetSourceComponent = function MediaLibraryAssetSourceComponent(
  props: AssetSourceComponentProps & {libraryId: string | null},
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    accept, // TODO: make the plugin respect this filter?
    action = 'select',
    assetSource,
    assetType = 'image',
    dialogHeaderTitle,
    libraryId: libraryIdProp,
    onClose,
    onSelect,
    selectedAssets, // TODO: allow for pre-selected assets?
    schemaType,
  } = props

  const {t} = useTranslation()
  const toast = useToast()
  const client = useClient({apiVersion: DEFAULT_API_VERSION})

  const projectId = client.config().projectId
  const cachedLibraryId = (projectId && fetchedLibraryIdCache.get(projectId)) || undefined
  const [mediaLibraryId, setMediaLibraryId] = useState<string | null>(
    libraryIdProp || cachedLibraryId || null,
  )

  const handleSetMediaLibraryId = useCallback(
    (libraryId: string) => {
      setMediaLibraryId(libraryId)
      if (projectId) {
        // Write to cache
        fetchedLibraryIdCache.set(projectId, libraryId)
      }
    },
    [projectId],
  )

  const handleSelect: SelectAssetsDialogProps['onSelect'] = useCallback(
    async (selection) => {
      if (!mediaLibraryId) {
        return
      }
      const asset = selection[0]

      // Metadata as configured in the schema
      const metadataPropsFromSchema: ImageMetadataType[] | undefined =
        schemaType && isImageSchemaType(schemaType) ? schemaType.options?.metadata : undefined

      // Link asset from media library to current dataset
      try {
        const result = await client.request({
          method: 'POST',
          url: `/assets/media-library-link/${client.config().dataset}?${metadataPropsFromSchema?.map((prop) => `meta[]=${prop}`).join('&') || ''}`,
          withCredentials: true,
          body: {
            mediaLibraryId: mediaLibraryId,
            assetInstanceId: asset.assetInstanceId,
            assetId: asset.asset._id,
          },
          tag: 'media-library.link-asset',
        })
        const assetDocument: SanityDocument = result.document
        const assetsFromSource: AssetFromSource[] = [
          {
            kind: 'assetDocumentId',
            value: assetDocument._id,
            mediaLibraryProps: {
              mediaLibraryId: mediaLibraryId,
              assetId: asset.asset._id,
              assetInstanceId: asset.assetInstanceId,
            },
          },
        ]
        onSelect(assetsFromSource)
        onClose()
      } catch (error) {
        toast.push({
          closable: true,
          status: 'error',
          title: t('asset-source.dialog.insert-asset-error'),
        })
        console.error(error)
        throw error
      }
    },
    [client, onClose, onSelect, mediaLibraryId, schemaType, t, toast],
  )

  const handleUploaded = useCallback(
    async (assets: AssetSelectionItem[]) => {
      handleSelect(assets)
      onClose()
    },
    [handleSelect, onClose],
  )

  /* Ensure a Media Library exists (provision if not) */
  if (projectId && !mediaLibraryId) {
    return (
      <EnsureMediaLibrary projectId={projectId} onSetMediaLibraryId={handleSetMediaLibraryId} />
    )
  }

  if (!mediaLibraryId) {
    return null
  }

  return (
    <>
      <UploadAssetsDialog
        open={action === 'upload'}
        libraryId={mediaLibraryId}
        onUploaded={handleUploaded}
        uploader={assetSource.uploader}
      />

      <SelectAssetsDialog
        dialogHeaderTitle={
          dialogHeaderTitle ||
          t('asset-source.dialog.default-title', {
            context: assetType,
          })
        }
        open={action === 'select'}
        ref={ref}
        onClose={onClose}
        onSelect={handleSelect}
        selection={[]}
        libraryId={mediaLibraryId}
        selectAssetType={assetType}
      />
    </>
  )
}

export const MediaLibraryAssetSource = memo(forwardRef(MediaLibraryAssetSourceComponent))
