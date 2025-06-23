import {type AssetFromSource, type AssetSource, type AssetSourceUploader} from '@sanity/types'
import {get} from 'lodash'
import {memo, useMemo} from 'react'

import {WithReferencedAsset} from '../../../utils/WithReferencedAsset'
import {type BaseImageInputProps} from './types'

function ImageInputAssetSourceComponent(
  props: Pick<BaseImageInputProps, 'value' | 'schemaType' | 'observeAsset' | 'isUploading'> & {
    selectedAssetSource: AssetSource | null
    handleAssetSourceClosed: () => void
    handleSelectAssetFromSource: (assetFromSource: AssetFromSource[]) => void
    uploader?: AssetSourceUploader
  },
) {
  const {
    handleAssetSourceClosed,
    handleSelectAssetFromSource,
    isUploading,
    observeAsset,
    schemaType,
    selectedAssetSource,
    uploader,
    value,
  } = props
  const accept = useMemo(() => get(schemaType, 'options.accept', 'image/*'), [schemaType])

  if (!selectedAssetSource) {
    return null
  }
  const {component: Component} = selectedAssetSource

  if (value && value.asset) {
    return (
      <WithReferencedAsset observeAsset={observeAsset} reference={value.asset}>
        {(imageAsset) => (
          <Component
            accept={accept}
            action={isUploading ? 'upload' : 'select'}
            assetSource={selectedAssetSource}
            assetType="image"
            onClose={handleAssetSourceClosed}
            onSelect={handleSelectAssetFromSource}
            schemaType={schemaType}
            selectedAssets={[imageAsset]}
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
      assetType="image"
      onClose={handleAssetSourceClosed}
      onSelect={handleSelectAssetFromSource}
      schemaType={schemaType}
      selectedAssets={[]}
      selectionType="single"
      uploader={uploader}
    />
  )
}
export const ImageInputAssetSource = memo(ImageInputAssetSourceComponent)
