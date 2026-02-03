import {type SchemaType} from '@sanity/types'
import {useCallback} from 'react'

import {useClient} from '../../../hooks'
import {useDocumentPreviewStore} from '../../../store'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {BaseFileInput, type BaseFileInputProps} from '../../inputs/files/FileInput'
import {useFormBuilder} from '../../useFormBuilder'
import {resolveUploader as defaultResolveUploader} from '../uploads/resolveUploader'
import {type FileLike} from '../uploads/types'
import {observeFileAsset} from './client-adapters/assets'

/**
 * @hidden
 * @beta */
export type FileInputProps = Omit<
  BaseFileInputProps,
  'assetSources' | 'directUploads' | 'observeAsset' | 'resolveUploader' | 'client' | 't'
>

/**
 * @hidden
 * @beta */
export function StudioFileInput(props: FileInputProps) {
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

  const observeAsset = useCallback(
    (id: string) => observeFileAsset(documentPreviewStore, id),
    [documentPreviewStore],
  )

  return (
    <BaseFileInput
      {...props}
      client={client}
      assetSources={assetSources}
      directUploads={fileConfig.directUploads}
      observeAsset={observeAsset}
      resolveUploader={resolveUploader}
    />
  )
}
