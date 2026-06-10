import {isFileSource} from '@sanity/asset-utils'
import {type AssetSource} from '@sanity/types'
import {Box, Card, Flex} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {ChangeIndicator} from '../../../../changeIndicators'
import {AssetSourceBrowser} from '../common/AssetSourceBrowser'
import {UploadPlaceholder} from '../common/UploadPlaceholder'
import {UploadProgress} from '../common/UploadProgress'
import {UploadTargetCard} from '../common/uploadTarget/UploadTargetCard'
import {UploadWarning} from '../common/UploadWarning'
import {FilePreview} from './FilePreview'
import {InvalidFileWarning} from './InvalidFileWarning'
import {type FileAssetProps} from './types'

const ASSET_FIELD_PATH = ['asset']

export function FileAsset(props: FileAssetProps) {
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
    value,
  } = props

  const disableNew = schemaType.options?.disableNew === true

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
    (assetSource: AssetSource, files: globalThis.File[]) => {
      if (directUploads && !readOnly) {
        onSelectFiles(assetSource, files)
      }
    },
    [directUploads, onSelectFiles, readOnly],
  )

  const hasValueOrUpload = Boolean(value?._upload || value?.asset)

  if (value && typeof value.asset !== 'undefined' && !value?._upload && !isFileSource(value)) {
    return <InvalidFileWarning onClearValue={clearField} />
  }

  return (
    <div style={elementProps.style}>
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
            assetSources={assetSources}
            isReadOnly={readOnly}
            onFocus={handleFileTargetFocus}
            onOpenSourceForUpload={onOpenSourceForUpload}
            onSelectFile={({assetSource, file}) => handleSelectFiles(assetSource, [file])}
            radius={2}
            sizing="border"
            style={{padding: 1}}
            tabIndex={0}
            types={[schemaType]}
          >
            <div style={{position: 'relative'}}>
              {!value?.asset && (
                <FileUploadPlaceHolder
                  {...props}
                  disableNew={disableNew}
                  onSelectFiles={handleSelectFiles}
                />
              )}
              {!value?._upload && value?.asset && (
                <FilePreview {...props} onSelectAssets={onSelectAssets} />
              )}
            </div>
          </UploadTargetCard>
        )}
      </ChangeIndicator>
    </div>
  )
}

function FileUploadPlaceHolder(props: FileAssetProps & {disableNew?: boolean}) {
  const {
    assetSources,
    directUploads,
    disableNew,
    onOpenSourceForUpload,
    onSelectFiles,
    schemaType,
    readOnly,
    setIsBrowseMenuOpen,
    onSelectAssetSourceForBrowse,
  } = props

  const browseElement = (
    <AssetSourceBrowser
      assetSources={assetSources}
      readOnly={readOnly}
      schemaType={schemaType}
      onSelectAssetSource={(assetSource) => {
        setIsBrowseMenuOpen(false)
        onSelectAssetSourceForBrowse?.(assetSource)
      }}
    />
  )

  return (
    <Card tone={readOnly ? 'transparent' : 'inherit'} border paddingX={3} paddingY={2} radius={2}>
      {disableNew ? (
        <Flex align="center" justify="flex-end">
          {browseElement}
        </Flex>
      ) : (
        <UploadPlaceholder
          assetSources={assetSources}
          browse={browseElement}
          directUploads={directUploads}
          onUpload={onSelectFiles}
          onOpenSourceForUpload={onOpenSourceForUpload}
          schemaType={schemaType}
          readOnly={readOnly}
          type="file"
        />
      )}
    </Card>
  )
}
