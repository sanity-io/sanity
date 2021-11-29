import React from 'react'
import type {AssetSource} from '@sanity/types'
import ImageInput from '../../inputs/files/ImageInput'
import resolveUploader from '../uploads/resolveUploader'
import {
  defaultImageAssetSources,
  formBuilderConfig,
  userDefinedImageAssetSources,
} from '../../legacyParts'
import {materializeReference} from './client-adapters/assets'
import {wrapWithDocument} from './wrapWithDocument'

const globalAssetSources = userDefinedImageAssetSources
  ? userDefinedImageAssetSources
  : defaultImageAssetSources

const SUPPORT_DIRECT_UPLOADS = formBuilderConfig?.images?.directUploads !== false

type Props = Omit<React.ComponentProps<typeof ImageInput>, 'assetSources'>

export default React.forwardRef(function SanityImageInput(props: Props, forwardedRef: any) {
  const sourcesFromSchema = props.type.options?.sources

  // note: type.options.sources may be an empty array and in that case we're
  // disabling selecting images from asset source  (it's a feature, not a bug)
  const assetSources = React.useMemo(
    (): AssetSource[] => (sourcesFromSchema || globalAssetSources).map(wrapWithDocument),
    [sourcesFromSchema]
  )

  return (
    <ImageInput
      {...props}
      resolveUploader={resolveUploader}
      materialize={materializeReference}
      assetSources={assetSources}
      directUploads={SUPPORT_DIRECT_UPLOADS}
      ref={forwardedRef}
    />
  )
})
