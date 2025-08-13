import {get} from 'lodash'
import {useCallback} from 'react'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {WithReferencedAsset} from '../../../utils/WithReferencedAsset'
import {FileSkeleton} from './FileSkeleton'
import {type FileAssetProps} from './types'

export function FileAssetSource(props: FileAssetProps) {
  const {
    isUploading,
    observeAsset,
    schemaType,
    selectedAssetSource,
    setSelectedAssetSource,
    onSelectAssets,
    value,
    uploader,
  } = props

  const {t} = useTranslation()

  const accept = get(schemaType, 'options.accept', '')

  const handleAssetSourceClosed = useCallback(() => {
    setSelectedAssetSource(null)
  }, [setSelectedAssetSource])

  if (!selectedAssetSource) {
    return null
  }

  const Component = selectedAssetSource.component
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
            action={isUploading ? 'upload' : 'select'}
            assetSource={selectedAssetSource}
            assetType="file"
            dialogHeaderTitle={t('inputs.file.dialog.title')}
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
      action={isUploading ? 'upload' : 'select'}
      assetSource={selectedAssetSource}
      assetType="file"
      dialogHeaderTitle={t('inputs.file.dialog.title')}
      onClose={handleAssetSourceClosed}
      onSelect={onSelectAssets}
      schemaType={schemaType}
      selectedAssets={[]}
      selectionType="single"
      uploader={uploader}
    />
  )
}
