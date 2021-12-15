import React, {MouseEventHandler} from 'react'
import {UploadIcon, SearchIcon, BinaryDocumentIcon, ReadOnlyIcon} from '@sanity/icons'
import {Flex, Text, Button, Inline} from '@sanity/ui'
import {get} from 'lodash'
import {FileLike} from '../../../sanity/uploads/types'
import {FileInputButton} from './FileInputButton/FileInputButton'
import {PlaceholderText} from './PlaceholderText'

type UploadPlaceholderProps = {
  onUpload?: (files: File[]) => void
  onBrowse?: MouseEventHandler<HTMLButtonElement>
  readOnly?: boolean | null
  type: string
  hoveringFiles: FileLike[]

  acceptedFiles: FileLike[]
  rejectedFilesCount: number
}

export default React.memo(function UploadImagePlaceholder({
  onBrowse,
  onUpload,
  readOnly,
  type,
  hoveringFiles,
  acceptedFiles,
  rejectedFilesCount,
}: UploadPlaceholderProps) {
  const accept = get(type, 'options.accept', '')
  return (
    <Flex
      align="center"
      justify="space-between"
      gap={[3, 4, 4]}
      direction={['column-reverse', 'column-reverse', 'row']}
      paddingY={[0, 2, 2]}
    >
      <Flex align="center" justify="center" gap={2} flex={1}>
        <PlaceholderText
          readOnly={readOnly}
          hoveringFiles={hoveringFiles}
          acceptedFiles={acceptedFiles}
          rejectedFilesCount={rejectedFilesCount}
          type={type}
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
          disabled={readOnly}
        />
        <Button
          fontSize={2}
          text="Browse"
          icon={SearchIcon}
          mode="ghost"
          onClick={onBrowse}
          data-testid="file-input-select-button"
          disabled={readOnly}
        />
      </Inline>
    </Flex>
  )
})
