import React, {useCallback, useMemo} from 'react'
import {SchemaType} from '@sanity/types'
import {FileInput, FileInputProps} from '../../inputs/files/FileInput'
import {resolveUploader as defaultResolveUploader} from '../uploads/resolveUploader'
import {useFormBuilder} from '../../useFormBuilder'
import {useDocumentPreviewStore} from '../../../datastores'
import {useClient} from '../../../hooks'
import {FileLike} from '../uploads/types'
import {observeFileAsset} from './client-adapters/assets'

export type StudioFileInputProps = Omit<
  FileInputProps,
  'assetSources' | 'directUploads' | 'observeAsset' | 'resolveUploader' | 'client'
>

export function StudioFileInput(props: StudioFileInputProps) {
  const sourcesFromSchema = props.schemaType.options?.sources
  const documentPreviewStore = useDocumentPreviewStore()
  const {file: fileConfig} = useFormBuilder().__internal
  const client = useClient()

  const resolveUploader = useCallback(
    (type: SchemaType, file: FileLike) => {
      if (!fileConfig.directUploads) {
        return null
      }
      return defaultResolveUploader(type, file)
    },
    [fileConfig.directUploads]
  )
  // NOTE: type.options.sources may be an empty array and in that case we're
  // disabling selecting images from asset source  (it's a feature, not a bug)
  const assetSources = useMemo(
    () => sourcesFromSchema || fileConfig.assetSources,
    [fileConfig, sourcesFromSchema]
  )

  const observeAsset = useCallback(
    (id: string) => observeFileAsset(documentPreviewStore, id),
    [documentPreviewStore]
  )

  return (
    <FileInput
      {...props}
      client={client}
      assetSources={assetSources}
      directUploads={fileConfig.directUploads}
      observeAsset={observeAsset}
      resolveUploader={resolveUploader}
    />
  )
}
