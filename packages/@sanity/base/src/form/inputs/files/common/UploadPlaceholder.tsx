import React from 'react'
import {UploadIcon} from '@sanity/icons'
import {Flex, Inline} from '@sanity/ui'
import {FileLike} from '../../../studio/uploads/types'
import {FileInputButton} from './FileInputButton/FileInputButton'
import {PlaceholderText} from './PlaceholderText'

type UploadPlaceholderProps = {
  onUpload?: (files: File[]) => void
  browse?: React.ReactNode
  readOnly?: boolean
  type: string
  hoveringFiles: FileLike[]
  acceptedFiles: FileLike[]
  rejectedFilesCount: number
  accept: string
  directUploads?: boolean
}

export const UploadPlaceholder = React.memo(function UploadPlaceholder({
  browse,
  onUpload,
  readOnly,
  type,
  hoveringFiles,
  acceptedFiles,
  rejectedFilesCount,
  accept,
  directUploads,
}: UploadPlaceholderProps) {
  return (
    <Flex
      align="center"
      justify="space-between"
      gap={4}
      direction={['column', 'column', 'row']}
      paddingY={[2, 2, 0]}
    >
      <Flex align="center" justify="center" gap={2} flex={1}>
        <PlaceholderText
          readOnly={readOnly}
          hoveringFiles={hoveringFiles}
          acceptedFiles={acceptedFiles}
          rejectedFilesCount={rejectedFilesCount}
          type={type}
          directUploads={directUploads}
        />
      </Flex>
      <Inline space={2}>
        <FileInputButton
          icon={UploadIcon}
          mode="ghost"
          onSelect={onUpload}
          accept={accept}
          text="Upload"
          data-testid="file-input-upload-button"
          disabled={readOnly || !directUploads}
        />
        {browse}
      </Inline>
    </Flex>
  )
})
