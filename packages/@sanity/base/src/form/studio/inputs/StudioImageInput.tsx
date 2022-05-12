import React, {useCallback, useMemo} from 'react'
import imageUrlBuilder from '@sanity/image-url'
import {ImageInput, ImageInputProps} from '../../inputs/files/ImageInput'
import {useFormBuilder} from '../../useFormBuilder'
import {useDocumentPreviewStore} from '../../../datastores'
import {useSource} from '../../../studio'
import {observeImageAsset} from './client-adapters/assets'

export type StudioImageInputProps = Omit<
  ImageInputProps,
  'assetSources' | 'directUploads' | 'imageUrlBuilder' | 'observeAsset' | 'client'
>

export function StudioImageInput(props: StudioImageInputProps) {
  const sourcesFromSchema = props.schemaType.options?.sources
  const {image} = useFormBuilder().__internal
  const documentPreviewStore = useDocumentPreviewStore()
  const {client} = useSource()
  const versionedClient = useMemo(() => client.withConfig({apiVersion: '1'}), [client])

  // note: type.options.sources may be an empty array and in that case we're
  // disabling selecting images from asset source  (it's a feature, not a bug)
  const assetSources = React.useMemo(
    () => sourcesFromSchema || image.assetSources,
    [image, sourcesFromSchema]
  )

  const builder = React.useMemo(() => imageUrlBuilder(versionedClient), [versionedClient])

  const observeAsset = useCallback(
    (id: string) => observeImageAsset(documentPreviewStore, id),
    [documentPreviewStore]
  )

  return (
    <ImageInput
      {...props}
      client={client}
      assetSources={assetSources}
      directUploads={image.directUploads}
      imageUrlBuilder={builder}
      observeAsset={observeAsset}
    />
  )
}
