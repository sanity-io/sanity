import {type SchemaType} from '@sanity/types'
import {useCallback} from 'react'

import {observeVideoAsset} from '../../../core/form/studio/inputs/client-adapters/assets'
import {resolveUploader as defaultResolveUploader} from '../../../core/form/studio/uploads/resolveUploader'
import {type FileLike} from '../../../core/form/studio/uploads/types'
import {useFormBuilder} from '../../../core/form/useFormBuilder'
import {useClient} from '../../../core/hooks/useClient'
import {useDocumentPreviewStore} from '../../../core/store/_legacy/datastores'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../core/studioClient'
import {sourceName} from '../asset-source'
import {BaseVideoInput, type BaseVideoInputProps} from './VideoInput'

export type VideoInputProps = Omit<
  BaseVideoInputProps,
  'assetSources' | 'directUploads' | 'observeAsset' | 'resolveUploader' | 'client' | 't'
>

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
