import React, {useState} from 'react'
import {UploadIcon} from '@sanity/icons'
import {Flex, useElementSize} from '@sanity/ui'
import {FileLike} from '../../../studio/uploads/types'
import {FileInputButton} from './FileInputButton/FileInputButton'
import {PlaceholderText} from './PlaceholderText'

interface UploadPlaceholderProps {
  accept: string
  acceptedFiles: FileLike[]
  browse?: React.ReactNode
  directUploads?: boolean
  hoveringFiles: FileLike[]
  onUpload?: (files: File[]) => void
  readOnly?: boolean
  rejectedFilesCount: number
  type: string
}

function UploadPlaceholderComponent(props: UploadPlaceholderProps) {
  const {
    accept,
    acceptedFiles,
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

  return (
    <Flex
      align={collapsed ? undefined : 'center'}
      direction={collapsed ? 'column' : 'row'}
      gap={4}
      justify="space-between"
      paddingY={collapsed ? 1 : undefined}
      ref={setRootElement}
    >
      <Flex flex={1} justify="center">
        <PlaceholderText
          acceptedFiles={acceptedFiles}
          directUploads={directUploads}
          hoveringFiles={hoveringFiles}
          readOnly={readOnly}
          rejectedFilesCount={rejectedFilesCount}
          type={type}
        />
      </Flex>

      <Flex align="center" gap={2} justify="center" wrap="wrap">
        <FileInputButton
          accept={accept}
          data-testid="file-input-upload-button"
          disabled={readOnly || !directUploads}
          icon={UploadIcon}
          mode="ghost"
          onSelect={onUpload}
          text="Upload"
        />

        {browse}
      </Flex>
    </Flex>
  )
}

export const UploadPlaceholder = React.memo(UploadPlaceholderComponent)
