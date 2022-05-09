import React, {useCallback, useMemo} from 'react'
import imageUrlBuilder from '@sanity/image-url'
import {ImageInput, ImageInputProps} from '../../inputs/files/ImageInput'
import {withValuePath} from '../../utils/withValuePath'
import {useFormBuilder} from '../../useFormBuilder'
import {FIXME} from '../../types'
import {useDocumentPreviewStore} from '../../../datastores'
import {useSource} from '../../../studio'
import {observeImageAsset} from './client-adapters/assets'
import {wrapWithDocument} from './wrapWithDocument'

type StudioImageInputProps = Omit<ImageInputProps, 'assetSources'>

const ImageInputWithValuePath = withValuePath(ImageInput)

export const StudioImageInput = React.forwardRef(function StudioImageInput(
  props: StudioImageInputProps,
  forwardedRef: any
) {
  const sourcesFromSchema = props.schemaType.options?.sources
  const {image} = useFormBuilder().__internal
  const documentPreviewStore = useDocumentPreviewStore()
  const {client} = useSource()
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
      ref={forwardedRef as FIXME}
      imageUrlBuilder={builder}
    />
  )
})
