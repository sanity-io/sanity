import {type AssetSource} from '@sanity/types'
import {Box, Card} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {ChangeIndicator} from '../../../core/changeIndicators/ChangeIndicator'
import {AssetSourceBrowser} from '../../../core/form/inputs/files/common/AssetSourceBrowser'
import {UploadPlaceholder} from '../../../core/form/inputs/files/common/UploadPlaceholder'
import {UploadProgress} from '../../../core/form/inputs/files/common/UploadProgress'
import {UploadTargetCard} from '../../../core/form/inputs/files/common/uploadTarget/UploadTargetCard'
import {UploadWarning} from '../../../core/form/inputs/files/common/UploadWarning'
import {InvalidVideoWarning} from './InvalidVideoWarning'
import {type VideoAssetInputProps} from './types'
import {VideoPreview} from './VideoPreview'

const ASSET_FIELD_PATH = ['asset']

/**
 * Checks whether or not the given source is a video source
 * @param source - Source to check
 * @returns Whether or not the given source is a video source
 */
function isVideoSource(source: unknown): source is {asset: {_ref: string}} {
  if (typeof source !== 'object' || source === null || !('asset' in source)) {
    return false
  }
  const asset = (source as {asset: unknown}).asset
  if (typeof asset !== 'object' || asset === null || !('_ref' in asset)) {
    return false
  }
  const ref = (asset as {_ref: unknown})._ref
  return typeof ref === 'string' && ref.startsWith('media-library:')
}

export function VideoAsset(props: VideoAssetInputProps) {
  const {
    assetSources,
    changed,
    clearField,
    menuButtonRef,
    directUploads,
    elementProps,
    isStale,
    isUploading,
    onCancelUpload,
    onClearUploadStatus,
    onOpenSourceForUpload,
    onSelectAssets,
    onSelectFiles,
    onStale,
    path,
    readOnly,
    schemaType,
    setHoveringFiles,
    value,
  } = props

  const assetFieldPath = useMemo(() => path.concat(ASSET_FIELD_PATH), [path])

  const handleFileTargetFocus = useCallback(
    (event: React.FocusEvent) => {
      // We want to handle focus when the file target element *itself* receives
      // focus, not when an interactive child element receives focus. Since React has decided
      // to let focus bubble, so this workaround is needed
      // Background: https://github.com/facebook/react/issues/6410#issuecomment-671915381
      if (
        event.currentTarget === event.target &&
        event.currentTarget === elementProps.ref?.current
      ) {
        elementProps.onFocus(event)
      }
    },
    [elementProps],
  )

  const handleSelectFiles = useCallback(
    (assetSource: AssetSource, files: File[]) => {
      if (directUploads && !readOnly) {
        onSelectFiles(assetSource, files)
      }
    },
    [directUploads, onSelectFiles, readOnly],
  )

  const handleSelectFile = useCallback(
    ({assetSource, file}: {assetSource: AssetSource; file: File}) => {
      handleSelectFiles(assetSource, [file])
    },
    [handleSelectFiles],
  )

  const hasValueOrUpload = Boolean(value?._upload || value?.asset)

  if (value && typeof value.asset !== 'undefined' && !value?._upload && !isVideoSource(value)) {
    return <InvalidVideoWarning onClearValue={clearField} />
  }

  return (
    <>
      {isStale && (
        <Box marginBottom={2}>
          <UploadWarning onClearStale={onClearUploadStatus} />
        </Box>
      )}
      <ChangeIndicator path={assetFieldPath} hasFocus={!!props.focused} isChanged={changed}>
        {/* not uploading */}
        {value?._upload ? (
          <UploadProgress
            uploadState={value._upload}
            onCancel={isUploading && onCancelUpload ? onCancelUpload : undefined}
            onStale={onStale}
          />
        ) : (
          <UploadTargetCard
            {...elementProps}
            $border={hasValueOrUpload}
            isReadOnly={readOnly}
            onFocus={handleFileTargetFocus}
            onOpenSourceForUpload={onOpenSourceForUpload}
            onSelectFile={handleSelectFile}
            onSetHoveringFiles={setHoveringFiles}
            radius={2}
            assetSources={assetSources}
            sizing="border"
            style={{padding: 1}}
            tabIndex={0}
            types={[schemaType]}
          >
            <div style={{position: 'relative'}}>
              {!value?.asset && (
                <FileUploadPlaceHolder {...props} onSelectFiles={handleSelectFiles} />
              )}
              {!value?._upload && value?.asset && (
                <VideoPreview {...props} onSelectAssets={onSelectAssets} />
              )}
            </div>
          </UploadTargetCard>
        )}
      </ChangeIndicator>
    </>
  )
}

function FileUploadPlaceHolder(props: VideoAssetInputProps) {
  const {
    assetSources,
    directUploads,
    hoveringFiles,
    onOpenSourceForUpload,
    onSelectFiles,
    onSelectAssetSourceForBrowse,
    readOnly,
    schemaType,
    setIsBrowseMenuOpen,
    setSelectedAssetSource,
  } = props

  const browseElement = (
    <AssetSourceBrowser
      assetSources={assetSources}
      readOnly={readOnly}
      schemaType={schemaType}
      onSelectAssetSource={(assetSource) => {
        setIsBrowseMenuOpen(false)
        ;(onSelectAssetSourceForBrowse ?? setSelectedAssetSource)(assetSource)
      }}
    />
  )

  return (
    <>
      <Card
        tone={readOnly ? 'transparent' : 'inherit'}
        border
        paddingX={3}
        paddingY={2}
        radius={2}
        style={
          hoveringFiles.length === 0
            ? {borderStyle: 'dashed'}
            : {borderStyle: 'dashed', borderColor: 'transparent'}
        }
      >
        <UploadPlaceholder
          assetSources={assetSources}
          browse={browseElement}
          directUploads={directUploads}
          hoveringFiles={hoveringFiles}
          onOpenSourceForUpload={onOpenSourceForUpload}
          onUpload={onSelectFiles}
          readOnly={readOnly}
          schemaType={schemaType}
          type="file"
        />
      </Card>
    </>
  )
}
