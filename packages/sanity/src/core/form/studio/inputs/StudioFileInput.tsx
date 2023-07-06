import React, {useCallback, useMemo} from 'react'
import {SchemaType} from '@sanity/types'
import {BaseFileInput, BaseFileInputProps} from '../../inputs/files/FileInput'
import {resolveUploader as defaultResolveUploader} from '../uploads/resolveUploader'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {useFormBuilder} from '../../useFormBuilder'
import {FileLike} from '../uploads/types'
import {useDocumentPreviewStore} from '../../../store'
import {useClient} from '../../../hooks'
import {observeFileAsset} from './client-adapters/assets'

/**
 * @hidden
 * @beta */
export type FileInputProps = Omit<
  BaseFileInputProps,
  'assetSources' | 'directUploads' | 'observeAsset' | 'resolveUploader' | 'client'
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
