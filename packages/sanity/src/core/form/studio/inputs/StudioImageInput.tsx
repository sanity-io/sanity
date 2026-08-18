import {createImageUrlBuilder} from '@sanity/image-url'
import {useCallback, useMemo} from 'react'

import {useClient} from '../../../hooks/useClient'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useDocumentPreviewStore} from '../../../store/datastores'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {BaseImageInput} from '../../inputs/files/ImageInput/ImageInput'
import {type BaseImageInputProps} from '../../inputs/files/ImageInput/types'
import {useFormBuilder} from '../../useFormBuilder'
import {resolveUploader as defaultResolveUploader} from '../uploads/resolveUploader'
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
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {image: imageConfig} = useFormBuilder().__internal
  const documentPreviewStore = useDocumentPreviewStore()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const supportsImageUploads = imageConfig.directUploads

  const assetSources = sourcesFromSchema || imageConfig.assetSources

  const builder = useMemo(() => createImageUrlBuilder(client), [client])

  const observeAsset = useCallback(
    (id: string) => observeImageAsset(documentPreviewStore, id),
    [documentPreviewStore],
  )

  const {t} = useTranslation()
  return (
    <BaseImageInput
      {...props}
      t={t}
      client={client}
      assetSources={assetSources}
      directUploads={supportsImageUploads}
      imageUrlBuilder={builder}
      observeAsset={observeAsset}
      resolveUploader={defaultResolveUploader}
    />
  )
}
