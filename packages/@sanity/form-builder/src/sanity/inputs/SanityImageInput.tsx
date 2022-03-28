import React from 'react'
import type {AssetSource} from '@sanity/types'
import imageUrlBuilder from '@sanity/image-url'
import ImageInput from '../../inputs/files/ImageInput'
import {
  defaultImageAssetSources,
  formBuilderConfig,
  userDefinedImageAssetSources,
} from '../../legacyParts'
import {versionedClient} from '../versionedClient'
import withValuePath from '../../utils/withValuePath'
import {observeImageAsset} from './client-adapters/assets'
import {wrapWithDocument} from './wrapWithDocument'

const globalAssetSources: AssetSource[] = userDefinedImageAssetSources
  ? ensureArrayOfSources(userDefinedImageAssetSources)
  : defaultImageAssetSources

const SUPPORT_DIRECT_UPLOADS = formBuilderConfig?.images?.directUploads !== false

type Props = Omit<React.ComponentProps<typeof ImageInput>, 'assetSources'>

const ImageInputWithValuePath = withValuePath(ImageInput)

export default React.forwardRef(function SanityImageInput(props: Props, forwardedRef: any) {
  const sourcesFromSchema = props.type.options?.sources

  // note: type.options.sources may be an empty array and in that case we're
  // disabling selecting images from asset source  (it's a feature, not a bug)
  const assetSources = React.useMemo(
    () => (sourcesFromSchema || globalAssetSources).map(wrapWithDocument),
    [sourcesFromSchema]
  )

  const builder = React.useMemo(() => imageUrlBuilder(versionedClient), [])

  return (
    <ImageInputWithValuePath
      {...props}
      observeAsset={observeImageAsset}
      assetSources={assetSources}
      directUploads={SUPPORT_DIRECT_UPLOADS}
      ref={forwardedRef}
      imageUrlBuilder={builder}
    />
  )
})

function ensureArrayOfSources(sources: unknown): AssetSource[] {
  if (Array.isArray(sources)) {
    return sources
  }

  console.warn(
    'Configured image asset sources is not an array - if `part:@sanity/form-builder/input/image/asset-sources` is defined, make sure it returns an array!'
  )
  return defaultImageAssetSources
}
