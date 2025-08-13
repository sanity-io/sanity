import {type AssetSource, type UploadState} from '@sanity/types'
import {Box, type CardTone} from '@sanity/ui'
import {type FocusEvent, memo, useCallback, useMemo, useState} from 'react'

import {ChangeIndicator} from '../../../../changeIndicators/ChangeIndicator'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {resolveUploader} from '../../../studio/uploads/resolveUploader'
import type {InputProps} from '../../../types/inputProps'
import {FileTarget} from '../common/styles'
import {UploadDestinationPicker} from '../common/UploadDestinationPicker'
import {UploadWarning} from '../common/UploadWarning'
import {type ImageUrlBuilder} from '../types'
import {type BaseImageInputProps, type BaseImageInputValue, type FileInfo} from './types'
import {usePreviewImageSource} from './usePreviewImageSource'

const ASSET_FIELD_PATH = ['asset'] as const

function ImageInputAssetComponent(props: {
  assetSources: BaseImageInputProps['assetSources']
  directUploads: boolean
  elementProps: BaseImageInputProps['elementProps']
  handleClearUploadState: () => void
  handleFileTargetFocus: (event: FocusEvent<Element, Element>) => void
  onSelectFiles: (assetSource: AssetSource, files: File[]) => void
  hoveringFiles: FileInfo[]
  imageUrlBuilder: ImageUrlBuilder
  inputProps: Omit<InputProps, 'renderDefault'>
  isStale: boolean
  readOnly: boolean | undefined
  renderAssetMenu(): React.JSX.Element | null
  renderPreview: () => React.JSX.Element
  renderUploadPlaceholder(): React.JSX.Element
  renderUploadState(uploadState: UploadState): React.JSX.Element
  schemaType: BaseImageInputProps['schemaType']
  selectedAssetSource: AssetSource | null
  setHoveringFiles: (hoveringFiles: FileInfo[]) => void
  tone: CardTone
  value: BaseImageInputValue | undefined
}) {
  const {
    assetSources,
    directUploads,
    elementProps,
    handleClearUploadState,
    handleFileTargetFocus,
    onSelectFiles,
    hoveringFiles,
    inputProps,
    isStale,
    readOnly,
    renderAssetMenu,
    renderPreview,
    renderUploadPlaceholder,
    renderUploadState,
    schemaType,
    setHoveringFiles,
    tone,
    value,
    imageUrlBuilder,
  } = props

  const elementRef = elementProps.ref?.current

  const {t} = useTranslation()

  const hasValueOrUpload = Boolean(value?._upload || value?.asset)
  const path = useMemo(() => inputProps.path.concat(ASSET_FIELD_PATH), [inputProps.path])
  const {customProperties} = usePreviewImageSource({value, imageUrlBuilder})
  const [assetSourceDestination, setAssetSourceDestination] = useState<AssetSource | null>(null)
  const [showDestinationSourcePicker, setShowDestinationSourcePicker] = useState<boolean>(false)
  const [filesToUploadFromPaste, setFilesToUploadFromPaste] = useState<File[]>([])
  const hasMultipleUploadSources = assetSources.filter((s) => Boolean(s.Uploader)).length > 1

  const handleFilesOut = useCallback(() => {
    setHoveringFiles([])
    setShowDestinationSourcePicker(false)
  }, [setHoveringFiles])

  const handleFilesOver = useCallback(
    (fileInfo: FileInfo[]) => {
      setHoveringFiles(fileInfo)
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
    [directUploads, hasMultipleUploadSources, schemaType, setHoveringFiles],
  )

  const handleOnFiles = useCallback(
    (files: globalThis.File[]) => {
      if (directUploads === false || readOnly) {
        handleFilesOut()
        return
      }
      const acceptedFiles = files.filter((file) => resolveUploader?.(schemaType, file))
      const rejectedFilesCount = files.length - acceptedFiles.length

      if (rejectedFilesCount > 0) {
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
      handleFilesOut,
      hasMultipleUploadSources,
      onSelectFiles,
      readOnly,
      schemaType,
    ],
  )

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

  const handleUploadDestinationPickerClose = useCallback(() => {
    setShowDestinationSourcePicker(false)
    setAssetSourceDestination(null)
  }, [])

  return (
    <div style={customProperties}>
      {isStale && (
        <Box marginBottom={2}>
          <UploadWarning onClearStale={handleClearUploadState} />
        </Box>
      )}
      <ChangeIndicator path={path} hasFocus={!!inputProps.focused} isChanged={inputProps.changed}>
        {value?._upload ? (
          renderUploadState(value._upload)
        ) : (
          <FileTarget
            {...elementProps}
            onFocus={handleFileTargetFocus}
            tabIndex={0}
            disabled={Boolean(readOnly)}
            onFiles={handleOnFiles}
            onFilesOver={handleFilesOver}
            onFilesOut={handleFilesOut}
            tone={tone}
            $border={hasValueOrUpload || hoveringFiles.length > 0}
            sizing="border"
            radius={2}
          >
            {showDestinationSourcePicker && (
              <UploadDestinationPicker
                assetSources={assetSources}
                onSelectAssetSource={handleSetAssetSourceDestination}
                referenceElement={elementRef}
                onClose={handleUploadDestinationPickerClose}
                text={t('inputs.files.common.placeholder.select-asset-source-upload-destination', {
                  context: 'image',
                })}
              />
            )}
            {!value?.asset && renderUploadPlaceholder()}
            {!value?._upload && value?.asset && (
              <div style={{position: 'relative'}}>
                {renderPreview()}
                {renderAssetMenu()}
              </div>
            )}
          </FileTarget>
        )}
      </ChangeIndicator>
    </div>
  )
}
export const ImageInputAsset = memo(ImageInputAssetComponent)
