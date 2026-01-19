import {type AssetFromSource, type AssetSource, type AssetSourceUploader} from '@sanity/types'
import {get} from 'lodash-es'
import {memo, useMemo} from 'react'

import {WithReferencedAsset} from '../../../utils/WithReferencedAsset'
import {type BaseImageInputProps} from './types'

function ImageInputAssetSourceComponent(
  props: Pick<BaseImageInputProps, 'value' | 'schemaType' | 'observeAsset' | 'isUploading'> & {
    selectedAssetSource: AssetSource | null
    handleAssetSourceClosed: () => void
    handleSelectAssetFromSource: (assetFromSource: AssetFromSource[]) => void
    uploader?: AssetSourceUploader
    isArrayContext?: boolean
  },
) {
  const {
    handleAssetSourceClosed,
    handleSelectAssetFromSource,
    isArrayContext,
    isUploading,
    observeAsset,
    schemaType,
    selectedAssetSource,
    uploader,
    value,
  } = props
  const selectionType = isArrayContext ? 'multiple' : 'single'
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
            selectionType={selectionType}
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
      selectionType={selectionType}
      uploader={uploader}
    />
  )
}
export const ImageInputAssetSource = memo(ImageInputAssetSourceComponent)
