import {type AssetSource, type UploadState} from '@sanity/types'
import {Box} from '@sanity/ui'
import {type FocusEvent, memo, useCallback, useMemo} from 'react'

import {ChangeIndicator} from '../../../../changeIndicators'
import {type InputOnSelectFileFunctionProps, type InputProps} from '../../../types'
import {UploadTargetCard} from '../common/uploadTarget/UploadTargetCard'
import {UploadWarning} from '../common/UploadWarning'
import {type ImageUrlBuilder} from '../types'
import {type BaseImageInputProps, type BaseImageInputValue} from './types'
import {usePreviewImageSource} from './usePreviewImageSource'

const ASSET_FIELD_PATH = ['asset'] as const

function ImageInputAssetComponent(props: {
  assetSources: BaseImageInputProps['assetSources']
  directUploads: boolean
  elementProps: BaseImageInputProps['elementProps']
  handleClearUploadState: () => void
  handleFileTargetFocus: (event: FocusEvent<Element, Element>) => void
  onSelectFile: (assetSource: AssetSource, file: File) => void
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
  value: BaseImageInputValue | undefined
}) {
  const {
    elementProps,
    handleClearUploadState,
    handleFileTargetFocus,
    onSelectFile,
    inputProps,
    isStale,
    readOnly,
    renderAssetMenu,
    renderPreview,
    renderUploadPlaceholder,
    renderUploadState,
    schemaType,
    value,
    imageUrlBuilder,
  } = props

  const hasValueOrUpload = Boolean(value?._upload || value?.asset)
  const path = useMemo(() => inputProps.path.concat(ASSET_FIELD_PATH), [inputProps.path])
  const {customProperties} = usePreviewImageSource({value, imageUrlBuilder})

  const handleSelectFile = useCallback(
    ({assetSource, file}: InputOnSelectFileFunctionProps) => {
      onSelectFile(assetSource, file)
    },
    [onSelectFile],
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
