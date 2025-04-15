import {UploadIcon} from '@sanity/icons'
import {type AssetSource} from '@sanity/types'
import {Flex, useElementSize} from '@sanity/ui'
import {memo, type ReactNode, useCallback, useState} from 'react'

import {useTranslation} from '../../../../i18n'
import {type FileLike} from '../../../studio/uploads/types'
import {FileInputButton} from './FileInputButton/FileInputButton'
import {PlaceholderText} from './PlaceholderText'
import {UploadDropDownMenu} from './UploadDropDownMenu'

interface UploadPlaceholderProps {
  accept: string
  acceptedFiles: FileLike[]
  assetSources: AssetSource[]
  browse?: ReactNode
  directUploads?: boolean
  hoveringFiles: FileLike[]
  onUpload?: (assetSource: AssetSource, files: File[]) => void
  readOnly?: boolean
  rejectedFilesCount: number
  type: string
}

function UploadPlaceholderComponent(props: UploadPlaceholderProps) {
  const {
    accept,
    acceptedFiles,
    assetSources,
    browse,
    directUploads,
    hoveringFiles,
    onUpload,
    readOnly,
    rejectedFilesCount,
    type,
  } = props

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const rect = useElementSize(rootElement)

  // Adjust the layout in narrow containers
  const collapsed = rect?.border && rect.border.width < 440
  const {t} = useTranslation()

  const assetSourcesWithUpload = assetSources.filter((s) => Boolean(s.uploader))

  const handleSelectFiles = useCallback(
    (assetSource: AssetSource, files: File[]) => {
      if (onUpload) {
        onUpload(assetSource, files)
      }
    },
    [onUpload],
  )

  const uploadButton =
    assetSourcesWithUpload.length > 1 ? (
      <UploadDropDownMenu
        accept={accept}
        assetSources={assetSourcesWithUpload}
        directUploads={directUploads}
        onSelectFiles={handleSelectFiles}
        readOnly={readOnly}
      />
    ) : (
      <FileInputButton
        accept={accept}
        data-testid="file-input-upload-button"
        disabled={readOnly || !directUploads}
        icon={UploadIcon}
        mode="bleed"
        // eslint-disable-next-line react/jsx-no-bind
        onSelect={(files) => {
          if (onUpload) {
            onUpload(assetSourcesWithUpload[0], files)
          }
        }}
        text={t('input.files.common.upload-placeholder.file-input-button.text')}
      />
    )

  return (
    <Flex
      align={collapsed ? undefined : 'center'}
      direction={collapsed ? 'column' : 'row'}
      gap={4}
      justify="space-between"
      paddingY={collapsed ? 1 : undefined}
      ref={setRootElement}
    >
      <Flex flex={1}>
        <PlaceholderText
          acceptedFiles={acceptedFiles}
          directUploads={directUploads}
          hoveringFiles={hoveringFiles}
          readOnly={readOnly}
          rejectedFilesCount={rejectedFilesCount}
          type={type}
        />
      </Flex>

      <Flex align="center" gap={1} justify="center" wrap="wrap">
        {uploadButton}
        {browse}
      </Flex>
    </Flex>
  )
}

export const UploadPlaceholder = memo(UploadPlaceholderComponent)
