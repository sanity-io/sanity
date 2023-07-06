import React, {useCallback} from 'react'
import imageUrlBuilder from '@sanity/image-url'
import {SchemaType} from '@sanity/types'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {BaseImageInput, BaseImageInputProps} from '../../inputs/files/ImageInput'
import {useFormBuilder} from '../../useFormBuilder'
import {resolveUploader as defaultResolveUploader} from '../uploads/resolveUploader'
import {FileLike} from '../uploads/types'
import {useDocumentPreviewStore} from '../../../store'
import {useClient} from '../../../hooks'
import {observeImageAsset} from './client-adapters/assets'

/**
 * @hidden
 * @beta */
export type ImageInputProps = Omit<
  BaseImageInputProps,
  | 'assetSources'
  | 'directUploads'
  | 'imageUrlBuilder'
  | 'observeAsset'
  | 'client'
  | 'resolveUploader'
>

/**
 * @hidden
 * @beta */
export function StudioImageInput(props: ImageInputProps) {
  const sourcesFromSchema = props.schemaType.options?.sources
  const {image} = useFormBuilder().__internal
  const documentPreviewStore = useDocumentPreviewStore()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const formBuilder = useFormBuilder()
  const supportsImageUploads = formBuilder.__internal.image.directUploads

  const resolveUploader = useCallback(
    (type: SchemaType, file: FileLike) => {
      if (!supportsImageUploads) {
        return null
      }
      return defaultResolveUploader(type, file)
    },
    [supportsImageUploads]
  )

  // note: type.options.sources may be an empty array and in that case we're
  // disabling selecting images from asset source  (it's a feature, not a bug)
  const assetSources = React.useMemo(
    () => sourcesFromSchema || image.assetSources,
    [image, sourcesFromSchema]
  )

  const builder = React.useMemo(() => imageUrlBuilder(client), [client])

  const observeAsset = useCallback(
    (id: string) => observeImageAsset(documentPreviewStore, id),
    [documentPreviewStore]
  )

  return (
    <BaseImageInput
      {...props}
      client={client}
      assetSources={assetSources}
      directUploads={image.directUploads}
      imageUrlBuilder={builder}
      observeAsset={observeAsset}
      resolveUploader={resolveUploader}
    />
  )
}
