import {type AssetSourceComponentAction, type FileAsset} from '@sanity/types'
import {get} from 'lodash-es'
import {useCallback, useMemo} from 'react'

import {useTranslation} from '../../../../i18n'
import {WithReferencedAsset} from '../../../utils/WithReferencedAsset'
import {FileSkeleton} from './FileSkeleton'
import {type FileAssetProps} from './types'

export function FileAssetSource(
  props: FileAssetProps & {
    openInSourceAsset?: FileAsset | null
    setOpenInSourceAsset: (asset: FileAsset | null) => void
  },
) {
  const {
    isUploading,
    observeAsset,
    openInSourceAsset,
    schemaType,
    selectedAssetSource,
    setSelectedAssetSource,
    setOpenInSourceAsset,
    onSelectAssets,
    value,
    uploader,
  } = props

  const {t} = useTranslation()

  const accept = get(schemaType, 'options.accept', '')

  const handleAssetSourceClosed = useCallback(() => {
    setSelectedAssetSource(null)
    setOpenInSourceAsset(null)
  }, [setSelectedAssetSource, setOpenInSourceAsset])

  // Determine the action based on state - derived from props
  const action: AssetSourceComponentAction = useMemo(
    () => (openInSourceAsset ? 'openInSource' : isUploading ? 'upload' : 'select'),
    [openInSourceAsset, isUploading],
  )

  const handleChangeAction = useCallback(
    (newAction: AssetSourceComponentAction) => {
      // When switching from openInSource to select, clear the openInSourceAsset
      if (newAction === 'select' && openInSourceAsset) {
        setOpenInSourceAsset(null)
      }
    },
    [openInSourceAsset, setOpenInSourceAsset],
  )

  if (!selectedAssetSource) {
    return null
  }

  const Component = selectedAssetSource.component

  // When opening in source, render with the assetToOpen prop
  if (openInSourceAsset) {
    return (
      <Component
        accept={accept}
        action={action}
        assetSource={selectedAssetSource}
        assetType="file"
        assetToOpen={openInSourceAsset}
        dialogHeaderTitle={t('inputs.file.dialog.title')}
        onClose={handleAssetSourceClosed}
        onSelect={onSelectAssets}
        onChangeAction={handleChangeAction}
        schemaType={schemaType}
        selectedAssets={[openInSourceAsset]}
        selectionType="single"
        uploader={uploader}
      />
    )
  }

  if (value && value.asset) {
    return (
      <WithReferencedAsset
        observeAsset={observeAsset}
        reference={value.asset}
        waitPlaceholder={<FileSkeleton />}
      >
        {(fileAsset) => (
          <Component
            accept={accept}
            action={action}
            assetSource={selectedAssetSource}
            assetType="file"
            dialogHeaderTitle={t('inputs.file.dialog.title')}
            onChangeAction={handleChangeAction}
            onClose={handleAssetSourceClosed}
            onSelect={onSelectAssets}
            schemaType={schemaType}
            selectedAssets={[fileAsset]}
            selectionType="single"
            uploader={uploader}
          />
        )}
      </WithReferencedAsset>
    )
  }
  return (
    <Component
      accept={accept}
      action={action}
      assetSource={selectedAssetSource}
      assetType="file"
      dialogHeaderTitle={t('inputs.file.dialog.title')}
      onChangeAction={handleChangeAction}
      onClose={handleAssetSourceClosed}
      onSelect={onSelectAssets}
      schemaType={schemaType}
      selectedAssets={[]}
      selectionType="single"
      uploader={uploader}
    />
  )
}
