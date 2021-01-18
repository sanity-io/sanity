import React, {ForwardedRef, LegacyRef} from 'react'

// what's the idea behind this, can it be replaced by a local import?
import defaultAssetSources from 'all:part:@sanity/form-builder/input/image/asset-source'

import userDefinedAssetSources from 'part:@sanity/form-builder/input/image/asset-sources?'
import formBuilderConfig from 'config:@sanity/form-builder'
import ImageInput from '../../inputs/files/ImageInput'
import resolveUploader from '../uploads/resolveUploader'
import withDocument from '../../utils/withDocument'
import {materializeReference} from './client-adapters/assets'

const globalAssetSources = userDefinedAssetSources ? userDefinedAssetSources : defaultAssetSources

const SUPPORT_DIRECT_UPLOADS = formBuilderConfig?.images?.directUploads !== false

type Props = Omit<React.ComponentProps<typeof ImageInput>, 'assetSources'>

export default withDocument(
  React.forwardRef(function SanityImageInput(props: Props, forwardedRef: any) {
    // note: type.options.sources may be an empty array and in that case we're
    // disabling selecting images from asset source  (it's a feature, not a bug)
    const assetSources = props.type.options?.sources || globalAssetSources

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
)
