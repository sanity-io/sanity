import React from 'react'
import {AssetSource} from '@sanity/types'
import imageUrlBuilder from '@sanity/image-url'
import ImageInput from '../../inputs/files/ImageInput'
import resolveUploader from '../uploads/resolveUploader'
import {
  defaultImageAssetSources,
  formBuilderConfig,
  userDefinedImageAssetSources,
} from '../../legacyParts'
import {versionedClient} from '../versionedClient'
import withValuePath from '../../utils/withValuePath'
import {observeImageAsset} from './client-adapters/assets'
import {wrapWithDocument} from './wrapWithDocument'

const globalAssetSources = userDefinedImageAssetSources
  ? userDefinedImageAssetSources
  : defaultImageAssetSources

const SUPPORT_DIRECT_UPLOADS = formBuilderConfig?.images?.directUploads !== false

type Props = Omit<React.ComponentProps<typeof ImageInput>, 'assetSources'>

const ImageInputWithValuePath = withValuePath(ImageInput)

export default React.forwardRef(function SanityImageInput(props: Props, forwardedRef: any) {
  const sourcesFromSchema = props.type.options?.sources

  // note: type.options.sources may be an empty array and in that case we're
  // disabling selecting images from asset source  (it's a feature, not a bug)
  const assetSources = React.useMemo(
    (): AssetSource[] => (sourcesFromSchema || globalAssetSources).map(wrapWithDocument),
    [sourcesFromSchema]
  )

  const builder = React.useMemo(() => imageUrlBuilder(versionedClient), [])

  return (
    <ImageInputWithValuePath
      {...props}
      resolveUploader={resolveUploader}
      observeFileAsset={observeImageAsset}
      assetSources={assetSources}
      directUploads={SUPPORT_DIRECT_UPLOADS}
      ref={forwardedRef}
      imageUrlBuilder={builder}
    />
  )
})
