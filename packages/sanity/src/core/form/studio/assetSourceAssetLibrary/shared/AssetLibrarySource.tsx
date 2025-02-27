import {
  type AssetFromSource,
  type AssetSourceComponentProps,
  type SanityDocument,
} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {type ForwardedRef, forwardRef, memo, useCallback} from 'react'

import {useClient} from '../../../../../core/hooks'
import {useTranslation} from '../../../../i18n'
import {DEFAULT_API_VERSION} from '../constants'
import {SelectAssetsDialog, type SelectAssetsDialogProps} from './SelectAssetsDialog'

const AssetLibraryAssetSource = function AssetLibraryAssetSource(
  props: AssetSourceComponentProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {t} = useTranslation()
  const {selectedAssets, assetType = 'image', dialogHeaderTitle, onClose, onSelect, accept} = props

  const client = useClient({apiVersion: DEFAULT_API_VERSION})
  const toast = useToast()

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose()
    }
  }, [onClose])
  const handleSelect: SelectAssetsDialogProps['onSelect'] = useCallback(
    async (selection) => {
      const asset = selection[0]
      // Link asset from asset library to current dataset
      try {
        const result = await client.request({
          method: 'POST',
          url: `/assets/asset-library-link/${client.config().dataset}`,
          withCredentials: true,
          body: {
            assetLibraryId: libraryId,
            assetInstanceId: asset.instanceId,
            assetId: asset.assetId,
          },
        })
        const assetDocument: SanityDocument = result.document
        const assetsFromSource: AssetFromSource[] = [
          {
            kind: 'assetDocumentId',
            value: assetDocument._id,
            assetLibraryProps: {
              assetLibraryId: libraryId,
              assetId: asset.assetId,
              assetInstanceId: asset.instanceId,
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
    [client, handleClose, onSelect, t, toast],
  )

  // TODO: Get libraryId from somewhere
  const libraryId = 'al32RNT8lVAT'

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
      libraryId={libraryId}
      selectAssetType={assetType}
    />
  )
}

export const AssetLibrarySource = memo(forwardRef(AssetLibraryAssetSource))
