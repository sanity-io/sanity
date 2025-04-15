import {type AssetFromSource, type AssetSource} from '@sanity/types'
import {get} from 'lodash'
import {memo, useMemo} from 'react'

import {WithReferencedAsset} from '../../../utils/WithReferencedAsset'
import {type BaseImageInputProps} from './types'

function ImageInputAssetSourceComponent(
  props: Pick<BaseImageInputProps, 'value' | 'schemaType' | 'observeAsset' | 'isUploading'> & {
    selectedAssetSource: AssetSource | null
    handleAssetSourceClosed: () => void
    handleSelectAssetFromSource: (assetFromSource: AssetFromSource[]) => void
  },
) {
  const {
    handleAssetSourceClosed,
    handleSelectAssetFromSource,
    isUploading,
    observeAsset,
    schemaType,
    selectedAssetSource,
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
            action={isUploading ? 'upload' : 'select'}
            assetSource={selectedAssetSource}
            selectedAssets={[imageAsset]}
            assetType="image"
            accept={accept}
            selectionType="single"
            onClose={handleAssetSourceClosed}
            onSelect={handleSelectAssetFromSource}
          />
        )}
      </WithReferencedAsset>
    )
  }
  return (
    <Component
      action={isUploading ? 'upload' : 'select'}
      assetSource={selectedAssetSource}
      selectedAssets={[]}
      selectionType="single"
      assetType="image"
      accept={accept}
      onClose={handleAssetSourceClosed}
      onSelect={handleSelectAssetFromSource}
    />
  )
}
export const ImageInputAssetSource = memo(ImageInputAssetSourceComponent)
