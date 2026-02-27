import {
  type AssetFromSource,
  type AssetSource,
  type AssetSourceComponentAction,
  type AssetSourceUploader,
  type ImageAsset,
} from '@sanity/types'
import {get} from 'lodash-es'
import {memo, useCallback, useMemo} from 'react'

import {WithReferencedAsset} from '../../../utils/WithReferencedAsset'
import {type BaseImageInputProps} from './types'

function ImageInputAssetSourceComponent(
  props: Pick<BaseImageInputProps, 'value' | 'schemaType' | 'observeAsset' | 'isUploading'> & {
    selectedAssetSource: AssetSource | null
    handleAssetSourceClosed: () => void
    handleSelectAssetFromSource: (assetFromSource: AssetFromSource[]) => void
    openInSourceAsset?: ImageAsset | null
    setOpenInSourceAsset: (asset: ImageAsset | null) => void
    uploader?: AssetSourceUploader
  },
) {
  const {
    handleAssetSourceClosed,
    handleSelectAssetFromSource,
    isUploading,
    observeAsset,
    openInSourceAsset,
    schemaType,
    selectedAssetSource,
    setOpenInSourceAsset,
    uploader,
    value,
  } = props
  const accept = useMemo(() => get(schemaType, 'options.accept', 'image/*'), [schemaType])

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

  const handleClose = useCallback(() => {
    handleAssetSourceClosed()
    setOpenInSourceAsset(null)
  }, [handleAssetSourceClosed, setOpenInSourceAsset])

  if (!selectedAssetSource) {
    return null
  }
  const {component: Component} = selectedAssetSource

  // When opening in source, render with the assetToOpen prop
  if (openInSourceAsset) {
    return (
      <Component
        accept={accept}
        action={action}
        assetSource={selectedAssetSource}
        assetType="image"
        assetToOpen={openInSourceAsset}
        onChangeAction={handleChangeAction}
        onClose={handleClose}
        onSelect={handleSelectAssetFromSource}
        schemaType={schemaType}
        selectedAssets={[openInSourceAsset]}
        selectionType="single"
        uploader={uploader}
      />
    )
  }

  if (value && value.asset) {
    return (
      <WithReferencedAsset observeAsset={observeAsset} reference={value.asset}>
        {(imageAsset) => (
          <Component
            accept={accept}
            action={action}
            assetSource={selectedAssetSource}
            assetType="image"
            onChangeAction={handleChangeAction}
            onClose={handleClose}
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
      action={action}
      assetSource={selectedAssetSource}
      assetType="image"
      onChangeAction={handleChangeAction}
      onClose={handleClose}
      onSelect={handleSelectAssetFromSource}
      schemaType={schemaType}
      selectedAssets={[]}
      selectionType="single"
      uploader={uploader}
    />
  )
}
export const ImageInputAssetSource = memo(ImageInputAssetSourceComponent)
