import {getImageDimensions} from '@sanity/asset-utils'
import {type AssetSource, type UploadState} from '@sanity/types'
import {Box} from '@sanity/ui'
import {type CSSProperties, type FocusEvent, memo, useCallback, useMemo, useRef} from 'react'

import {ChangeIndicator} from '../../../../changeIndicators'
import {type InputOnSelectFileFunctionProps, type InputProps} from '../../../types'
import {UploadTargetCard} from '../common/uploadTarget/UploadTargetCard'
import {UploadWarning} from '../common/UploadWarning'
import {type BaseImageInputProps, type BaseImageInputValue} from './types'

const ASSET_FIELD_PATH = ['asset'] as const

function ImageInputAssetComponent(props: {
  assetSources: BaseImageInputProps['assetSources']
  directUploads: boolean
  elementProps: BaseImageInputProps['elementProps']
  handleClearUploadState: () => void
  onSelectFiles: (assetSource: AssetSource, files: File[]) => void
  inputProps: Omit<InputProps, 'renderDefault'>
  isStale: boolean
  readOnly: boolean | undefined
  renderAssetMenu: () => React.JSX.Element
  renderPreview: () => React.JSX.Element
  renderUploadPlaceholder: () => React.JSX.Element
  renderUploadState: (uploadState: UploadState) => React.JSX.Element
  schemaType: BaseImageInputProps['schemaType']
  selectedAssetSource: AssetSource | null
  value: BaseImageInputValue | undefined
}) {
  const {
    elementProps,
    handleClearUploadState,
    onSelectFiles,
    inputProps,
    isStale,
    readOnly,
    renderAssetMenu,
    renderPreview,
    renderUploadPlaceholder,
    renderUploadState,
    schemaType,
    value,
  } = props

  const hasValueOrUpload = Boolean(value?._upload || value?.asset)
  const path = useMemo(() => inputProps.path.concat(ASSET_FIELD_PATH), [inputProps.path])
  const customProperties = useMemo(() => {
    const {width = 0, height = 0} = value?.asset ? getImageDimensions(value.asset) : {}
    return {'--image-width': width, '--image-height': height} as CSSProperties
  }, [value])

  // Track files dropped via drag-drop to batch them for multi-file upload
  // UploadTargetCard calls onSelectFile once per file, so we batch them
  const pendingFilesRef = useRef<{assetSource: AssetSource | null; files: File[]}>({
    assetSource: null,
    files: [],
  })
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Flush pending files to the onSelectFiles handler
  const flushPendingFiles = useCallback(() => {
    if (pendingFilesRef.current.files.length > 0 && pendingFilesRef.current.assetSource) {
      onSelectFiles(pendingFilesRef.current.assetSource, pendingFilesRef.current.files)
      pendingFilesRef.current = {assetSource: null, files: []}
    }
  }, [onSelectFiles])

  // Handle individual file selections from UploadTargetCard (called once per file on drag-drop)
  // We batch them together and call onSelectFiles with all files at once
  const handleSelectFile = useCallback(
    ({assetSource, file}: InputOnSelectFileFunctionProps) => {
      // Clear any pending flush
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current)
      }

      // If this is a new batch (different asset source), flush the old one first
      if (
        pendingFilesRef.current.assetSource &&
        pendingFilesRef.current.assetSource !== assetSource
      ) {
        flushPendingFiles()
      }

      // Add to pending batch
      pendingFilesRef.current.assetSource = assetSource
      pendingFilesRef.current.files.push(file)

      // Schedule flush after a short delay to collect all files from the same drop.
      // UploadTargetCard fires onSelectFile once per file during drag-drop (not batched),
      // so we use a 50ms window to collect all files before processing them together.
      // This allows multi-file drag-drop to work correctly with sibling insertion.
      flushTimeoutRef.current = setTimeout(flushPendingFiles, 50)
    },
    [flushPendingFiles],
  )

  const handleFileTargetFocus = useCallback(
    (event: FocusEvent) => {
      // We want to handle focus when the file target element *itself* receives
      // focus, not when an interactive child element receives focus. Since React has decided
      // to let focus bubble, so this workaround is needed
      // Background: https://github.com/facebook/react/issues/6410#issuecomment-671915381
      if (
        event.currentTarget === event.target &&
        event.currentTarget === elementProps.ref?.current
      ) {
        inputProps.elementProps.onFocus(event)
      }
    },
    [inputProps, elementProps.ref?.current],
  )

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
          <UploadTargetCard
            {...elementProps}
            $border={hasValueOrUpload}
            isReadOnly={readOnly}
            onFocus={handleFileTargetFocus}
            onSelectFile={handleSelectFile}
            radius={2}
            sizing="border"
            tabIndex={0}
            types={[schemaType]}
          >
            {!value?.asset && renderUploadPlaceholder()}
            {!value?._upload && value?.asset && (
              <div style={{position: 'relative'}}>
                {renderPreview()}
                {renderAssetMenu()}
              </div>
            )}
          </UploadTargetCard>
        )}
      </ChangeIndicator>
    </div>
  )
}
export const ImageInputAsset = memo(ImageInputAssetComponent)
