import {type SchemaType} from '@sanity/types'
import {useCallback} from 'react'

import {useClient} from '../../../hooks'
import {useDocumentPreviewStore} from '../../../store'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {BaseVideoInput, type BaseVideoInputProps} from '../../inputs/files/VideoInput'
import {useFormBuilder} from '../../useFormBuilder'
import {sourceName} from '../assetSourceMediaLibrary/createAssetSource'
import {resolveUploader as defaultResolveUploader} from '../uploads/resolveUploader'
import {type FileLike} from '../uploads/types'
import {observeVideoAsset} from './client-adapters/assets'

/**
 * @hidden
 * @beta */
export type VideoInputProps = Omit<
  BaseVideoInputProps,
  'assetSources' | 'directUploads' | 'observeAsset' | 'resolveUploader' | 'client' | 't'
>

/**
 * @hidden
 * @beta */
export function StudioVideoInput(props: VideoInputProps) {
  const sourcesFromSchema = props.schemaType.options?.sources
  const documentPreviewStore = useDocumentPreviewStore()
  const {file: fileConfig} = useFormBuilder().__internal
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const resolveUploader = useCallback(
    (type: SchemaType, file: FileLike) => {
      if (!fileConfig.directUploads) {
        return null
      }
      return defaultResolveUploader(type, file)
    },
    [fileConfig.directUploads],
  )

  const assetSources = sourcesFromSchema || fileConfig.assetSources
  const filteredAssetSources = assetSources.filter((source) => source.name === sourceName)

  const observeAsset = useCallback(
    (id: string) => observeVideoAsset(documentPreviewStore, id),
    [documentPreviewStore],
  )

  return (
    <BaseVideoInput
      {...props}
      client={client}
      assetSources={filteredAssetSources}
      directUploads={fileConfig.directUploads}
      observeAsset={observeAsset}
      resolveUploader={resolveUploader}
    />
  )
}
