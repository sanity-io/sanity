import React from 'react'

import ImageInput from '../../inputs/files/ImageInput'
import resolveUploader from '../uploads/resolveUploader'
import withDocument from '../../utils/withDocument'
import {defaultAssetSources, formBuilderConfig, userDefinedAssetSources} from '../../legacyParts'
import {materializeReference} from './client-adapters/assets'

const globalAssetSources = userDefinedAssetSources ? userDefinedAssetSources : defaultAssetSources

const SUPPORT_DIRECT_UPLOADS = formBuilderConfig?.images?.directUploads !== false

type Props = Omit<React.ComponentProps<typeof ImageInput>, 'assetSources'>

export default React.forwardRef(function SanityImageInput(props: Props, forwardedRef: any) {
  const sourcesFromSchema = props.type.options?.sources

  // note: type.options.sources may be an empty array and in that case we're
  // disabling selecting images from asset source  (it's a feature, not a bug)
  const assetSources = React.useMemo(
    () =>
      (sourcesFromSchema || globalAssetSources).map((source) => ({
        ...source,
        // Note: The asset source plugin get's passed the enclosing document by default.
        // This is a potential performance hog, so we should consider some alternatives here
        // e.g. we could offer a way to declare the path for the values in the document you're interested in instead
        component: withDocument(source.component),
      })),
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
