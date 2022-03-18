import React, {useCallback, useMemo} from 'react'
import imageUrlBuilder from '@sanity/image-url'
import {useClient, useDatastores} from '@sanity/base'
import {ImageInput, ImageInputProps} from '../../inputs/files/ImageInput'
import {withValuePath} from '../../utils/withValuePath'
import {useFormBuilder} from '../../useFormBuilder'
import {observeImageAsset} from './client-adapters/assets'
import {wrapWithDocument} from './wrapWithDocument'

type SanityImageInputProps = Omit<ImageInputProps, 'assetSources'>

const ImageInputWithValuePath = withValuePath(ImageInput)

export const SanityImageInput = React.forwardRef(function SanityImageInput(
  props: SanityImageInputProps,
  forwardedRef: any
) {
  const sourcesFromSchema = props.type.options?.sources
  const {image} = useFormBuilder()
  const {documentPreviewStore} = useDatastores()
  const client = useClient()
  const versionedClient = useMemo(() => client.withConfig({apiVersion: '1'}), [client])

  // note: type.options.sources may be an empty array and in that case we're
  // disabling selecting images from asset source  (it's a feature, not a bug)
  const assetSources = React.useMemo(
    () => (sourcesFromSchema || image.assetSources).map(wrapWithDocument),
    [image, sourcesFromSchema]
  )

  const builder = React.useMemo(() => imageUrlBuilder(versionedClient), [versionedClient])

  const observeAsset = useCallback(
    (id: string) => {
      return observeImageAsset(documentPreviewStore, id)
    },
    [documentPreviewStore]
  )

  return (
    <ImageInputWithValuePath
      {...props}
      observeAsset={observeAsset}
      assetSources={assetSources}
      directUploads={image.directUploads}
      ref={forwardedRef as any}
      imageUrlBuilder={builder}
    />
  )
})
