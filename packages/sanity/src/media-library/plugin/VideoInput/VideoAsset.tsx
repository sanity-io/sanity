import {type AssetSource} from '@sanity/types'
import {Box, Card} from '@sanity/ui'
import {type CardTone} from '@sanity/ui/theme'
import {get} from 'lodash'
import {useCallback, useMemo, useState} from 'react'

import {ChangeIndicator} from '../../../core/changeIndicators/ChangeIndicator'
import {PlaceholderText} from '../../../core/form/inputs/files/common/PlaceholderText'
import {type FileInfo, FileTarget} from '../../../core/form/inputs/files/common/styles'
import {UploadDestinationPicker} from '../../../core/form/inputs/files/common/UploadDestinationPicker'
import {UploadPlaceholder} from '../../../core/form/inputs/files/common/UploadPlaceholder'
import {UploadProgress} from '../../../core/form/inputs/files/common/UploadProgress'
import {UploadWarning} from '../../../core/form/inputs/files/common/UploadWarning'
import {useTranslation} from '../../../core/i18n'
import {Browser} from './Browser'
import {InvalidVideoWarning} from './InvalidVideoWarning'
import {CardOverlay, FlexContainer} from './styles'
import {type VideoAssetProps} from './types'
import {VideoPreview} from './VideoPreview'

const ASSET_FIELD_PATH = ['asset']

/**
 * Checks whether or not the given source is a video source
 * @param source - Source to check
 * @returns Whether or not the given source is a video source
 */
function isVideoSource(source: any) {
  return source?.asset?._ref?.startsWith('media-library:')
}

export function VideoAsset(props: VideoAssetProps) {
  const {
    assetSources,
    changed,
    clearField,
    directUploads,
    elementProps,
    hoveringFiles,
    isStale,
    isUploading,
    onCancelUpload,
    onClearUploadStatus,
    onSelectAssets,
    onSelectFiles,
    onStale,
    path,
    readOnly,
    resolveUploader,
    schemaType,
    setHoveringFiles,
    value,
  } = props

  const {t} = useTranslation()

  const assetFieldPath = useMemo(() => path.concat(ASSET_FIELD_PATH), [path])

  const [assetSourceDestination, setAssetSourceDestination] = useState<AssetSource | null>(null)
  const [showDestinationSourcePicker, setShowDestinationSourcePicker] = useState<boolean>(false)
  const [filesToUploadFromPaste, setFilesToUploadFromPaste] = useState<File[]>([])
  const elementRef = elementProps.ref?.current

  const hasMultipleUploadSources = assetSources.filter((s) => Boolean(s.Uploader)).length > 1

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

  const handleFilesOver = useCallback(
    (fileInfo: FileInfo[]) => {
      setHoveringFiles(fileInfo.filter((file) => file.kind !== 'string'))
      let canUpload = true
      const acceptedFiles = fileInfo.filter((file) => resolveUploader?.(schemaType, file))
      const rejectedFilesCount = fileInfo.length - acceptedFiles.length

      if (fileInfo.length > 0) {
        if (rejectedFilesCount > 0 || directUploads === false) {
          canUpload = false
        }
      }

      if (hasMultipleUploadSources && canUpload) {
        setShowDestinationSourcePicker(true)
      }
    },
    [directUploads, hasMultipleUploadSources, resolveUploader, schemaType, setHoveringFiles],
  )

  const handleFilesOut = useCallback(() => {
    setHoveringFiles([])
    setShowDestinationSourcePicker(false)
  }, [setHoveringFiles])

  const handleSelectFiles = useCallback(
    (assetSource: AssetSource, files: globalThis.File[]) => {
      if (directUploads && !readOnly) {
        setHoveringFiles([])
        onSelectFiles(assetSource, files)
      } else if (hoveringFiles.length > 0) {
        handleFilesOut()
      }
    },
    [
      directUploads,
      handleFilesOut,
      hoveringFiles.length,
      onSelectFiles,
      readOnly,
      setHoveringFiles,
    ],
  )

  const getVideoTone = useCallback((): CardTone => {
    // Get the video tone
    const acceptedFiles = hoveringFiles.filter((file) => resolveUploader?.(schemaType, file))
    const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

    if (hoveringFiles.length > 0) {
      if (rejectedFilesCount > 0 || directUploads === false) {
        return 'critical'
      }
    }

    if (!value?._upload && !readOnly && hoveringFiles.length > 0) {
      return 'primary'
    }
    return value?._upload && value?.asset && readOnly ? 'neutral' : 'default'
  }, [
    directUploads,
    hoveringFiles,
    readOnly,
    resolveUploader,
    schemaType,
    value?._upload,
    value?.asset,
  ])

  const hasValueOrUpload = Boolean(value?._upload || value?.asset)

  const handleSetAssetSourceDestination = useCallback(
    (assetSource: AssetSource | null) => {
      setAssetSourceDestination(assetSource)
      // If the destination menu is open from pasting files
      // initiate the file selection after user has clicked the desired destination
      if (assetSource && filesToUploadFromPaste.length > 0) {
        setShowDestinationSourcePicker(false)
        onSelectFiles(assetSource, filesToUploadFromPaste)
        setFilesToUploadFromPaste([])
        setAssetSourceDestination(null)
      }
    },
    [filesToUploadFromPaste, onSelectFiles, setAssetSourceDestination],
  )

  const handleOnFiles = useCallback(
    (files: globalThis.File[]) => {
      const acceptedFiles = files.filter((file) => resolveUploader?.(schemaType, file))
      const rejectedFilesCount = files.length - acceptedFiles.length

      if (rejectedFilesCount > 0 || directUploads === false) {
        return
      }

      if (files.length === 0) {
        return
      }
      if (hasMultipleUploadSources) {
        if (assetSourceDestination) {
          onSelectFiles(assetSourceDestination, files)
          setShowDestinationSourcePicker(false)
          setAssetSourceDestination(null)
          return
        }
        setShowDestinationSourcePicker(true)
        setFilesToUploadFromPaste(files)
      } else {
        const firstAssetSourceWithUpload = assetSources.filter((s) => s.Uploader)[0]
        if (firstAssetSourceWithUpload) {
          onSelectFiles(firstAssetSourceWithUpload, files)
        }
        setShowDestinationSourcePicker(false)
        setAssetSourceDestination(null)
      }
    },
    [
      assetSourceDestination,
      assetSources,
      directUploads,
      hasMultipleUploadSources,
      onSelectFiles,
      resolveUploader,
      schemaType,
    ],
  )

  const handleUploadDestinationPickerClose = useCallback(() => {
    setShowDestinationSourcePicker(false)
    setAssetSourceDestination(null)
  }, [])

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
          <FileTarget
            {...elementProps}
            onFocus={handleFileTargetFocus}
            tabIndex={0}
            disabled={readOnly || directUploads === false}
            onFiles={handleOnFiles}
            onFilesOver={handleFilesOver}
            onFilesOut={handleFilesOut}
            tone={getVideoTone()}
            $border={hasValueOrUpload || hoveringFiles.length > 0}
            style={{padding: 1}}
            sizing="border"
            radius={2}
          >
            <div style={{position: 'relative'}}>
              {showDestinationSourcePicker && (
                <UploadDestinationPicker
                  assetSources={assetSources}
                  onSelectAssetSource={handleSetAssetSourceDestination}
                  referenceElement={elementRef}
                  onClose={handleUploadDestinationPickerClose}
                  text={t(
                    'inputs.files.common.placeholder.select-asset-source-upload-destination',
                    {
                      context: 'file',
                    },
                  )}
                />
              )}
              {!value?.asset && (
                <FileUploadPlaceHolder {...props} onSelectFiles={handleSelectFiles} />
              )}
              {value?.asset && hoveringFiles.length > 0 ? (
                <AssetPlaceholder
                  {...props}
                  tone={getVideoTone()}
                  onSelectFiles={handleSelectFiles}
                />
              ) : null}
              {!value?._upload && value?.asset && (
                <VideoPreview {...props} onSelectAssets={onSelectAssets} />
              )}
            </div>
          </FileTarget>
        )}
      </ChangeIndicator>
    </>
  )
}

function FileUploadPlaceHolder(props: VideoAssetProps) {
  const {
    assetSources,
    directUploads,
    hoveringFiles,
    onSelectFiles,
    readOnly,
    resolveUploader,
    schemaType,
  } = props

  const acceptedFiles = hoveringFiles.filter((file) => resolveUploader?.(schemaType, file))
  const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

  const accept = get(schemaType, 'options.accept', '')

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
          accept={accept}
          acceptedFiles={acceptedFiles}
          assetSources={assetSources}
          browse={<Browser {...props} />}
          directUploads={directUploads}
          hoveringFiles={hoveringFiles}
          onUpload={onSelectFiles}
          readOnly={readOnly}
          rejectedFilesCount={rejectedFilesCount}
          type="file"
        />
      </Card>
    </>
  )
}

function AssetPlaceholder(props: VideoAssetProps & {tone: CardTone}) {
  const {directUploads, schemaType, readOnly, resolveUploader, hoveringFiles, tone} = props

  const acceptedFiles = hoveringFiles.filter((file) => resolveUploader?.(schemaType, file))
  const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

  return (
    <CardOverlay radius={2} tone={tone}>
      <FlexContainer align="center" justify="center" gap={2} flex={1}>
        <PlaceholderText
          directUploads={directUploads}
          readOnly={readOnly}
          hoveringFiles={hoveringFiles}
          acceptedFiles={acceptedFiles}
          rejectedFilesCount={rejectedFilesCount}
          type="file"
        />
      </FlexContainer>
    </CardOverlay>
  )
}
