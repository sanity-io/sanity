import React, {useCallback} from 'react'
import {FileInput, FileInputProps} from '../../inputs/files/FileInput'
import {resolveUploader} from '../uploads/resolveUploader'
import {useFormBuilder} from '../../useFormBuilder'
import {useDocumentPreviewStore} from '../../../datastores'
import {observeFileAsset} from './client-adapters/assets'
import {wrapWithDocument} from './wrapWithDocument'

export type StudioFileInputProps = Omit<FileInputProps, 'assetSources'>

export function StudioFileInput(props: StudioFileInputProps) {
  const sourcesFromSchema = props.schemaType.options?.sources
  const documentPreviewStore = useDocumentPreviewStore()
  const {file} = useFormBuilder().__internal

  // note: type.options.sources may be an empty array and in that case we're
  // disabling selecting images from asset source  (it's a feature, not a bug)
  const assetSources = React.useMemo(
    () => (sourcesFromSchema || file.assetSources).map(wrapWithDocument),
    [file, sourcesFromSchema]
  )

  const observeAsset = useCallback(
    (id: string) => {
      return observeFileAsset(documentPreviewStore, id)
    },
    [documentPreviewStore]
  )

  return (
    <FileInput
      {...props}
      assetSources={assetSources}
      directUploads={file.directUploads}
      observeAsset={observeAsset}
      resolveUploader={resolveUploader}
    />
  )
}
