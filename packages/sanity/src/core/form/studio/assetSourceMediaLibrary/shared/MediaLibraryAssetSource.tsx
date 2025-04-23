import {
  type AssetFromSource,
  type AssetSourceComponentProps,
  type SanityDocument,
} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {type ForwardedRef, forwardRef, memo, useCallback, useEffect, useState} from 'react'

import {useClient} from '../../../../hooks'
import {useTranslation} from '../../../../i18n'
import {DEFAULT_API_VERSION} from '../constants'
import {type AssetSelectionItem} from '../types'
import {SelectAssetsDialog, type SelectAssetsDialogProps} from './SelectAssetsDialog'
import {UploadAssetsDialog} from './UploadAssetDialog'

// Cache for fetched Media Library ID when 'libraryId' is not specified in the config.
const fetchedLibraryIdCache: Map<string, string> = new Map()

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
  } = props

  const {t} = useTranslation()
  const toast = useToast()
  const client = useClient({apiVersion: DEFAULT_API_VERSION})

  const projectId = client.config().projectId

  const cachedFetchedLibraryId = (projectId && fetchedLibraryIdCache.get(projectId)) || undefined
  const [fetchedLibraryId, setFetchedLibraryId] = useState<string | null>(
    cachedFetchedLibraryId || null,
  )

  useEffect(() => {
    if (libraryIdProp || fetchedLibraryId) {
      return
    }
    if (!projectId) {
      throw new Error('projectId is required to fetch Media Library ID')
    }
    client.request({uri: `/media-libraries`, query: {projectId}}).then((result) => {
      const libraryIdFromResult = result.data[0]?.id
      if (libraryIdFromResult) {
        // Add to cache for this project (organization)
        fetchedLibraryIdCache.set(projectId, libraryIdFromResult)
        setFetchedLibraryId(libraryIdFromResult)
      }
    })
  }, [client, fetchedLibraryId, libraryIdProp, projectId])

  const resolvedLibraryId = libraryIdProp || fetchedLibraryId

  const handleSelect: SelectAssetsDialogProps['onSelect'] = useCallback(
    async (selection) => {
      if (!resolvedLibraryId) {
        return
      }
      const asset = selection[0]
      // Link asset from media library to current dataset
      try {
        const result = await client.request({
          method: 'POST',
          url: `/assets/media-library-link/${client.config().dataset}`,
          withCredentials: true,
          body: {
            mediaLibraryId: resolvedLibraryId,
            assetInstanceId: asset.assetInstanceId,
            assetId: asset.asset._id,
          },
        })
        const assetDocument: SanityDocument = result.document
        const assetsFromSource: AssetFromSource[] = [
          {
            kind: 'assetDocumentId',
            value: assetDocument._id,
            mediaLibraryProps: {
              mediaLibraryId: resolvedLibraryId,
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
    [client, onClose, onSelect, resolvedLibraryId, t, toast],
  )

  const handleUploaded = useCallback(
    async (assets: AssetSelectionItem[]) => {
      handleSelect(assets)
      onClose()
    },
    [handleSelect, onClose],
  )

  if (!resolvedLibraryId) {
    return null
  }

  return (
    <>
      <UploadAssetsDialog
        open={action === 'upload'}
        libraryId={resolvedLibraryId}
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
        libraryId={resolvedLibraryId}
        selectAssetType={assetType}
      />
    </>
  )
}

export const MediaLibraryAssetSource = memo(forwardRef(MediaLibraryAssetSourceComponent))
