import {get} from 'lodash'
import {useCallback} from 'react'
import {type Asset} from 'sanity'

import {WithReferencedAsset} from '../../../core/form/utils/WithReferencedAsset'
import {useTranslation} from '../../../core/i18n/hooks/useTranslation'
import {type VideoAssetProps} from './types'
import {VideoSkeleton} from './VideoSkeleton'

export function VideoInputAssetSource(props: VideoAssetProps) {
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
  const assetType = 'sanity.video' as const

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
        waitPlaceholder={<VideoSkeleton />}
      >
        {(videoAsset) => (
          <Component
            accept={accept}
            action={isUploading ? 'upload' : 'select'}
            assetSource={selectedAssetSource}
            assetType={assetType}
            dialogHeaderTitle={t('inputs.file.dialog.title')}
            onClose={handleAssetSourceClosed}
            onSelect={onSelectAssets}
            schemaType={schemaType}
            selectedAssets={[videoAsset as unknown as Asset]}
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
      assetType={assetType}
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
