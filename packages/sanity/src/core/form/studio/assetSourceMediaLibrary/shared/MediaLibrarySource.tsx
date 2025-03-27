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
import {SelectAssetsDialog, type SelectAssetsDialogProps} from './SelectAssetsDialog'

const MediaLibraryAssetSource = function MediaLibraryAssetSource(
  props: AssetSourceComponentProps & {libraryId: string | null},
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {t} = useTranslation()
  const client = useClient({apiVersion: DEFAULT_API_VERSION})
  const toast = useToast()

  const {
    accept,
    assetType = 'image',
    dialogHeaderTitle,
    libraryId: libraryIdProp,
    onClose,
    onSelect,
    selectedAssets,
  } = props
  const [fetchedLibraryId, setFetchedLibraryId] = useState<string | null>(null)

  useEffect(() => {
    if (libraryIdProp) {
      return
    }
    client.request({uri: `/projects/${client.config().projectId}`}).then((project) => {
      const {organizationId} = project
      client
        .withConfig({
          useProjectHostname: false,
        })
        .request({uri: `/media-libraries`, query: {organizationId}, useGlobalApi: true})
        .then((result) => {
          const libraryIdFromResult = result.data[0]?.id
          if (libraryIdFromResult) {
            setFetchedLibraryId(libraryIdFromResult)
          }
        })
    })
  }, [client, libraryIdProp])

  const resolvedLibraryId = libraryIdProp || fetchedLibraryId

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])
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
            assetId: asset.assetId,
          },
        })
        const assetDocument: SanityDocument = result.document
        const assetsFromSource: AssetFromSource[] = [
          {
            kind: 'assetDocumentId',
            value: assetDocument._id,
            mediaLibraryProps: {
              mediaLibraryId: resolvedLibraryId,
              assetId: asset.assetId,
              assetInstanceId: asset.assetInstanceId,
            },
          },
        ]
        onSelect(assetsFromSource)
        handleClose()
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
    [client, handleClose, onSelect, resolvedLibraryId, t, toast],
  )

  if (!resolvedLibraryId) {
    return null
  }

  return (
    <SelectAssetsDialog
      dialogHeaderTitle={
        dialogHeaderTitle ||
        t('asset-source.dialog.default-title', {
          context: assetType,
        })
      }
      ref={ref}
      onClose={handleClose}
      onSelect={handleSelect}
      selection={[]}
      libraryId={resolvedLibraryId}
      selectAssetType={assetType}
    />
  )
}

export const MediaLibrarySource = memo(forwardRef(MediaLibraryAssetSource))
