import React from 'react'
import FileInput from '../../inputs/files/FileInput'
import resolveUploader from '../uploads/resolveUploader'
import {
  defaultFileAssetSources,
  formBuilderConfig,
  userDefinedFileAssetSources,
} from '../../legacyParts'
import withValuePath from '../../utils/withValuePath'
import {materializeReference} from './client-adapters/assets'
import {wrapWithDocument} from './wrapWithDocument'

const globalAssetSources = userDefinedFileAssetSources
  ? userDefinedFileAssetSources
  : defaultFileAssetSources

const SUPPORT_DIRECT_UPLOADS = formBuilderConfig?.files?.directUploads !== false

type Props = Omit<React.ComponentProps<typeof FileInput>, 'assetSources'>

export default React.forwardRef(function SanityFileInput(props: Props, forwardedRef: any) {
  const sourcesFromSchema = props.type.options?.sources

  // note: type.options.sources may be an empty array and in that case we're
  // disabling selecting images from asset source  (it's a feature, not a bug)
  const assetSources = React.useMemo(
    () => (sourcesFromSchema || globalAssetSources).map(wrapWithDocument),
    [sourcesFromSchema]
  )

  const FileInputWithValuePath = withValuePath(FileInput)

  return (
    <FileInputWithValuePath
      {...props}
      resolveUploader={resolveUploader}
      materialize={materializeReference}
      assetSources={assetSources}
      directUploads={SUPPORT_DIRECT_UPLOADS}
      ref={forwardedRef}
    />
  )
})
